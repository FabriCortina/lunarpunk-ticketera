import { AppError } from '../utils/errors';
import { BlogRepository, BlogPostStatus, BlogCommentStatus } from '../repositories/blog.repository';
import { CreateBlogPostInput, UpdateBlogPostInput } from '../schemas/blog.schema';
import db from '../database/connection';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export class BlogService {
  constructor(private blogRepository: BlogRepository) {}

  async listPublished(query: { page: number; limit: number; search?: string; tag?: string; category?: string }) {
    return this.blogRepository.listPublished(query.page, query.limit, query);
  }

  async getBySlug(slug: string) {
    const post = await this.blogRepository.findBySlug(slug);
    if (!post || post.status !== 'PUBLISHED') {
      throw new AppError('Post not found', 404);
    }
    return post;
  }

  async listMine(userId: string) {
    return this.blogRepository.listByAuthor(userId);
  }

  async createPost(userId: string, role: string, data: CreateBlogPostInput) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.title);
    const categories = data.categories?.map((name) => ({ name, slug: slugify(name) })) ?? [];
    const tags = data.tags?.map((name) => ({ name, slug: slugify(name) })) ?? [];

    const post = await this.blogRepository.createPost({
      author_id: userId,
      title: data.title,
      slug,
      excerpt: data.excerpt ?? null,
      content: data.content,
      cover_image_url: data.coverImageUrl ?? null,
      status: 'DRAFT'
    }, categories, tags);

    if (role === 'ADMIN') {
      await this.logAdminAction('BLOG_CREATE', userId, post.id);
    }
    return post;
  }

  async updatePost(userId: string, role: string, postId: string, data: UpdateBlogPostInput) {
    const existing = await this.blogRepository.findById(postId);
    if (!existing) {
      throw new AppError('Post not found', 404);
    }
    if (role !== 'ADMIN' && existing.author_id !== userId) {
      throw new AppError('Forbidden', 403);
    }
    if (role !== 'ADMIN' && existing.status === 'PUBLISHED') {
      throw new AppError('Published posts can only be edited by ADMIN', 403);
    }

    const slug = data.slug ? slugify(data.slug) : undefined;
    const categories = data.categories?.map((name) => ({ name, slug: slugify(name) }));
    const tags = data.tags?.map((name) => ({ name, slug: slugify(name) }));

    const updated = await this.blogRepository.updatePost(postId, {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      cover_image_url: data.coverImageUrl
    }, categories, tags);

    if (!updated) {
      throw new AppError('Post not found', 404);
    }

    if (role === 'ADMIN') {
      await this.logAdminAction('BLOG_UPDATE', userId, postId);
    }
    return updated;
  }

  async submitForReview(userId: string, postId: string) {
    const existing = await this.blogRepository.findById(postId);
    if (!existing) {
      throw new AppError('Post not found', 404);
    }
    if (existing.author_id !== userId) {
      throw new AppError('Forbidden', 403);
    }
    if (existing.status !== 'DRAFT') {
      throw new AppError('Only drafts can be submitted', 400);
    }
    return this.blogRepository.updateStatus(postId, 'PENDING_REVIEW');
  }

  async publish(adminId: string, postId: string) {
    const updated = await this.blogRepository.updateStatus(postId, 'PUBLISHED', new Date());
    if (!updated) {
      throw new AppError('Post not found', 404);
    }
    await this.logAdminAction('BLOG_PUBLISH', adminId, postId);
    return updated;
  }

  async archive(adminId: string, postId: string) {
    const updated = await this.blogRepository.updateStatus(postId, 'ARCHIVED');
    if (!updated) {
      throw new AppError('Post not found', 404);
    }
    await this.logAdminAction('BLOG_ARCHIVE', adminId, postId);
    return updated;
  }

  async listPendingReview() {
    return this.blogRepository.listPendingReview();
  }

  async addComment(postId: string, userId: string, content: string) {
    const post = await this.blogRepository.findById(postId);
    if (!post || post.status !== 'PUBLISHED') {
      throw new AppError('Post not found', 404);
    }
    return this.blogRepository.addComment(postId, userId, content);
  }

  async listApprovedComments(postId: string) {
    return this.blogRepository.listApprovedComments(postId);
  }

  async listPendingComments() {
    return this.blogRepository.listPendingComments();
  }

  async updateCommentStatus(adminId: string, commentId: string, status: BlogCommentStatus) {
    const updated = await this.blogRepository.updateCommentStatus(commentId, status);
    if (!updated) {
      throw new AppError('Comment not found', 404);
    }
    await this.logAdminAction(
      status === 'APPROVED' ? 'BLOG_COMMENT_APPROVE' : 'BLOG_COMMENT_REJECT',
      adminId,
      updated.post_id
    );
    return updated;
  }

  async addView(postId: string, viewerId?: string | null, ip?: string | null, userAgent?: string | null) {
    const post = await this.blogRepository.findById(postId);
    if (!post || post.status !== 'PUBLISHED') {
      return;
    }
    await this.blogRepository.addView(postId, viewerId, ip, userAgent);
  }

  async listCategories() {
    return this.blogRepository.listCategories();
  }

  async listTags() {
    return this.blogRepository.listTags();
  }

  private async logAdminAction(action: string, adminId: string, postId: string) {
    await db('admin_actions').insert({
      admin_id: adminId,
      target_user_id: adminId,
      action,
      metadata: { postId }
    });
  }
}
