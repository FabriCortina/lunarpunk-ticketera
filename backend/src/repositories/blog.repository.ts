import { Knex } from 'knex';
import db from '../database/connection';

export type BlogPostStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type BlogCommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface BlogPostEntity {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image_url?: string | null;
  status: BlogPostStatus;
  published_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface BlogPostListItem extends BlogPostEntity {
  author_name?: string | null;
  author_email?: string | null;
  categories?: { id: string; name: string; slug: string }[];
  tags?: { id: string; name: string; slug: string }[];
}

export interface BlogCommentEntity {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  status: BlogCommentStatus;
  created_at: Date;
}

export class BlogRepository {
  private db: Knex = db;

  async createPost(
    data: Partial<BlogPostEntity>,
    categories: { name: string; slug: string }[] = [],
    tags: { name: string; slug: string }[] = []
  ): Promise<BlogPostEntity> {
    return this.db.transaction(async (trx) => {
      const [post] = await trx('blog_posts').insert(data).returning('*');
      if (categories.length > 0) {
        const categoryIds = await this.ensureCategories(trx, categories);
        await trx('blog_post_categories').insert(
          categoryIds.map((id) => ({ post_id: post.id, category_id: id }))
        );
      }
      if (tags.length > 0) {
        const tagIds = await this.ensureTags(trx, tags);
        await trx('blog_post_tags').insert(
          tagIds.map((id) => ({ post_id: post.id, tag_id: id }))
        );
      }
      return post;
    });
  }

  async updatePost(
    id: string,
    data: Partial<BlogPostEntity>,
    categories: { name: string; slug: string }[] | undefined,
    tags: { name: string; slug: string }[] | undefined
  ): Promise<BlogPostEntity | undefined> {
    return this.db.transaction(async (trx) => {
      const [updated] = await trx('blog_posts')
        .where({ id })
        .update({ ...data, updated_at: trx.fn.now() })
        .returning('*');

      if (!updated) return undefined;

      if (categories) {
        await trx('blog_post_categories').where({ post_id: id }).del();
        if (categories.length > 0) {
          const categoryIds = await this.ensureCategories(trx, categories);
          await trx('blog_post_categories').insert(
            categoryIds.map((categoryId) => ({ post_id: id, category_id: categoryId }))
          );
        }
      }

      if (tags) {
        await trx('blog_post_tags').where({ post_id: id }).del();
        if (tags.length > 0) {
          const tagIds = await this.ensureTags(trx, tags);
          await trx('blog_post_tags').insert(
            tagIds.map((tagId) => ({ post_id: id, tag_id: tagId }))
          );
        }
      }

      return updated;
    });
  }

  async findById(id: string): Promise<BlogPostListItem | undefined> {
    const post = await this.db('blog_posts')
      .leftJoin('users', 'blog_posts.author_id', 'users.id')
      .select(
        'blog_posts.*',
        'users.name as author_name',
        'users.email as author_email'
      )
      .where('blog_posts.id', id)
      .first();

    if (!post) return undefined;
    return this.attachCategoriesTags([post]).then((rows) => rows[0]);
  }

  async findBySlug(slug: string): Promise<BlogPostListItem | undefined> {
    const post = await this.db('blog_posts')
      .leftJoin('users', 'blog_posts.author_id', 'users.id')
      .select(
        'blog_posts.*',
        'users.name as author_name',
        'users.email as author_email'
      )
      .where('blog_posts.slug', slug)
      .first();

    if (!post) return undefined;
    return this.attachCategoriesTags([post]).then((rows) => rows[0]);
  }

  async listPublished(
    page: number,
    limit: number,
    filters: { search?: string; tag?: string; category?: string }
  ): Promise<BlogPostListItem[]> {
    const offset = (page - 1) * limit;
    const query = this.db('blog_posts')
      .leftJoin('users', 'blog_posts.author_id', 'users.id')
      .select(
        'blog_posts.*',
        'users.name as author_name',
        'users.email as author_email'
      )
      .where('blog_posts.status', 'PUBLISHED')
      .orderBy('blog_posts.published_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (filters.search) {
      query.andWhere((qb) => {
        qb.whereILike('blog_posts.title', `%${filters.search}%`)
          .orWhereILike('blog_posts.excerpt', `%${filters.search}%`);
      });
    }

    if (filters.tag) {
      query
        .leftJoin('blog_post_tags', 'blog_posts.id', 'blog_post_tags.post_id')
        .leftJoin('blog_tags', 'blog_tags.id', 'blog_post_tags.tag_id')
        .andWhere('blog_tags.slug', filters.tag);
    }

    if (filters.category) {
      query
        .leftJoin('blog_post_categories', 'blog_posts.id', 'blog_post_categories.post_id')
        .leftJoin('blog_categories', 'blog_categories.id', 'blog_post_categories.category_id')
        .andWhere('blog_categories.slug', filters.category);
    }

    const posts = await query;
    return this.attachCategoriesTags(posts);
  }

  async listPendingReview(): Promise<BlogPostListItem[]> {
    const posts = await this.db('blog_posts')
      .leftJoin('users', 'blog_posts.author_id', 'users.id')
      .select(
        'blog_posts.*',
        'users.name as author_name',
        'users.email as author_email'
      )
      .where('blog_posts.status', 'PENDING_REVIEW')
      .orderBy('blog_posts.created_at', 'desc');

    return this.attachCategoriesTags(posts);
  }

  async listByAuthor(authorId: string): Promise<BlogPostListItem[]> {
    const posts = await this.db('blog_posts')
      .leftJoin('users', 'blog_posts.author_id', 'users.id')
      .select(
        'blog_posts.*',
        'users.name as author_name',
        'users.email as author_email'
      )
      .where('blog_posts.author_id', authorId)
      .orderBy('blog_posts.created_at', 'desc');

    return this.attachCategoriesTags(posts);
  }

  async updateStatus(id: string, status: BlogPostStatus, publishedAt?: Date | null) {
    const [post] = await this.db('blog_posts')
      .where({ id })
      .update({
        status,
        published_at: publishedAt ?? null,
        updated_at: this.db.fn.now()
      })
      .returning('*');
    return post;
  }

  async addComment(postId: string, userId: string, content: string) {
    const [comment] = await this.db('blog_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content,
        status: 'PENDING'
      })
      .returning('*');
    return comment as BlogCommentEntity;
  }

  async listApprovedComments(postId: string) {
    return this.db('blog_comments')
      .leftJoin('users', 'blog_comments.user_id', 'users.id')
      .select(
        'blog_comments.*',
        'users.name as author_name',
        'users.email as author_email'
      )
      .where({ post_id: postId })
      .andWhere('blog_comments.status', 'APPROVED')
      .orderBy('blog_comments.created_at', 'asc');
  }

  async listPendingComments() {
    return this.db('blog_comments')
      .leftJoin('users', 'blog_comments.user_id', 'users.id')
      .leftJoin('blog_posts', 'blog_comments.post_id', 'blog_posts.id')
      .select(
        'blog_comments.*',
        'users.name as author_name',
        'users.email as author_email',
        'blog_posts.title as post_title'
      )
      .where({ 'blog_comments.status': 'PENDING' })
      .orderBy('blog_comments.created_at', 'desc');
  }

  async updateCommentStatus(id: string, status: BlogCommentStatus) {
    const [comment] = await this.db('blog_comments')
      .where({ id })
      .update({ status })
      .returning('*');
    return comment;
  }

  async addView(postId: string, viewerId?: string | null, ip?: string | null, userAgent?: string | null) {
    await this.db('blog_views').insert({
      post_id: postId,
      viewer_id: viewerId ?? null,
      ip: ip ?? null,
      user_agent: userAgent ?? null
    });
  }

  async listCategories() {
    return this.db('blog_categories').orderBy('name', 'asc');
  }

  async listTags() {
    return this.db('blog_tags').orderBy('name', 'asc');
  }

  private async ensureCategories(trx: Knex, categories: { name: string; slug: string }[]) {
    const existing = await trx('blog_categories')
      .whereIn('slug', categories.map((c) => c.slug));
    const existingSlugs = new Set(existing.map((c: any) => c.slug));
    const toInsert = categories.filter((c) => !existingSlugs.has(c.slug));
    if (toInsert.length > 0) {
      await trx('blog_categories').insert(toInsert);
    }
    const all = await trx('blog_categories')
      .whereIn('slug', categories.map((c) => c.slug));
    return all.map((c: any) => c.id);
  }

  private async ensureTags(trx: Knex, tags: { name: string; slug: string }[]) {
    const existing = await trx('blog_tags')
      .whereIn('slug', tags.map((t) => t.slug));
    const existingSlugs = new Set(existing.map((t: any) => t.slug));
    const toInsert = tags.filter((t) => !existingSlugs.has(t.slug));
    if (toInsert.length > 0) {
      await trx('blog_tags').insert(toInsert);
    }
    const all = await trx('blog_tags')
      .whereIn('slug', tags.map((t) => t.slug));
    return all.map((t: any) => t.id);
  }

  private async attachCategoriesTags(posts: any[]) {
    if (!posts.length) return [];
    const postIds = posts.map((p) => p.id);
    const categories = await this.db('blog_post_categories')
      .leftJoin('blog_categories', 'blog_post_categories.category_id', 'blog_categories.id')
      .select(
        'blog_post_categories.post_id',
        'blog_categories.id',
        'blog_categories.name',
        'blog_categories.slug'
      )
      .whereIn('blog_post_categories.post_id', postIds);
    const tags = await this.db('blog_post_tags')
      .leftJoin('blog_tags', 'blog_post_tags.tag_id', 'blog_tags.id')
      .select(
        'blog_post_tags.post_id',
        'blog_tags.id',
        'blog_tags.name',
        'blog_tags.slug'
      )
      .whereIn('blog_post_tags.post_id', postIds);
    return posts.map((post) => ({
      ...post,
      categories: categories.filter((c) => c.post_id === post.id).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug
      })),
      tags: tags.filter((t) => t.post_id === post.id).map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug
      }))
    }));
  }
}
