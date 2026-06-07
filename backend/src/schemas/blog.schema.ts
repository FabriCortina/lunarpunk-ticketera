import { z } from 'zod';
import { httpUrlSchema } from './common';

export const createBlogPostSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).optional(),
  excerpt: z.string().min(10).optional(),
  content: z.string().min(20),
  coverImageUrl: httpUrlSchema.optional(),
  categories: z.array(z.string().min(2)).optional(),
  tags: z.array(z.string().min(2)).optional()
});

export const updateBlogPostSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).optional(),
  excerpt: z.string().min(10).optional(),
  content: z.string().min(20).optional(),
  coverImageUrl: httpUrlSchema.optional(),
  categories: z.array(z.string().min(2)).optional(),
  tags: z.array(z.string().min(2)).optional()
});

export const blogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().optional(),
  tag: z.string().optional(),
  category: z.string().optional()
});

export const blogIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const blogSlugParamsSchema = z.object({
  slug: z.string().min(3)
});

export const blogCommentSchema = z.object({
  content: z.string().min(1)
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
export type BlogListQuery = z.infer<typeof blogListQuerySchema>;
export type BlogCommentInput = z.infer<typeof blogCommentSchema>;
