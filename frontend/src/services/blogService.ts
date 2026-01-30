import { get, post, patch } from '../lib/api';
import { BlogPost, BlogComment, BlogCategory, BlogTag, BlogPostStatus, BlogCommentStatus } from '../types';

export type BlogListResponse = BlogPost[];

export const blogService = {
  listPublished: async (params: { page?: number; limit?: number; search?: string; tag?: string; category?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.tag) query.set('tag', params.tag);
    if (params.category) query.set('category', params.category);
    const qs = query.toString();
    return get<BlogListResponse>(`/api/blog${qs ? `?${qs}` : ''}`);
  },
  getBySlug: async (slug: string) => get<BlogPost>(`/api/blog/${slug}`),
  listMine: async () => get<BlogPost[]>('/api/blog/me'),
  create: async (payload: {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    coverImageUrl?: string;
    categories?: string[];
    tags?: string[];
  }) => post<BlogPost>('/api/blog', payload),
  update: async (id: string, payload: Partial<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    categories: string[];
    tags: string[];
  }>) => patch<BlogPost>(`/api/blog/${id}`, payload),
  submitReview: async (id: string) => post<BlogPost>(`/api/blog/${id}/submit`),
  publish: async (id: string) => post<BlogPost>(`/api/blog/${id}/publish`),
  archive: async (id: string) => post<BlogPost>(`/api/blog/${id}/archive`),
  listPending: async () => get<BlogPost[]>('/api/blog/pending'),
  listCategories: async () => get<BlogCategory[]>('/api/blog/categories'),
  listTags: async () => get<BlogTag[]>('/api/blog/tags'),
  addComment: async (postId: string, content: string) =>
    post<BlogComment>(`/api/blog/${postId}/comments`, { content }),
  listApprovedComments: async (postId: string) =>
    get<BlogComment[]>(`/api/blog/${postId}/comments`),
  listPendingComments: async () => get<BlogComment[]>('/api/blog/comments/pending'),
  approveComment: async (commentId: string) =>
    post<BlogComment>(`/api/blog/comments/${commentId}/approve`),
  rejectComment: async (commentId: string) =>
    post<BlogComment>(`/api/blog/comments/${commentId}/reject`),
  addView: async (postId: string) => post<void>(`/api/blog/${postId}/view`)
};

export type { BlogPost, BlogComment, BlogCategory, BlogTag, BlogPostStatus, BlogCommentStatus };
