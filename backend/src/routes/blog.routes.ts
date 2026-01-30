import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { BlogRepository } from '../repositories/blog.repository';
import { BlogService } from '../services/blog.service';
import { BlogController } from '../controllers/blog.controller';
import {
  blogCommentSchema,
  blogIdParamsSchema,
  blogListQuerySchema,
  blogSlugParamsSchema,
  createBlogPostSchema,
  updateBlogPostSchema
} from '../schemas/blog.schema';

export async function blogRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();
  const blogRepository = new BlogRepository();
  const blogService = new BlogService(blogRepository);
  const blogController = new BlogController(blogService);

  // Public
  router.get(
    '/',
    { schema: { querystring: blogListQuerySchema } },
    blogController.listPublished
  );
  router.get(
    '/categories',
    blogController.listCategories
  );
  router.get(
    '/tags',
    blogController.listTags
  );
  router.get(
    '/:slug',
    { schema: { params: blogSlugParamsSchema } },
    blogController.getBySlug
  );
  router.get(
    '/:id/comments',
    { schema: { params: blogIdParamsSchema } },
    blogController.listApprovedComments
  );
  router.post(
    '/:id/view',
    { schema: { params: blogIdParamsSchema } },
    blogController.addView
  );

  // Authenticated (read/write)
  router.register(async (protectedRouter) => {
    protectedRouter.addHook('preHandler', authenticate);

    protectedRouter.get('/me', blogController.listMine);

    protectedRouter.post(
      '/',
      {
        preHandler: authorize(['ADMIN', 'ORGANIZER']),
        schema: { body: createBlogPostSchema }
      },
      blogController.create
    );

    protectedRouter.patch(
      '/:id',
      {
        preHandler: authorize(['ADMIN', 'ORGANIZER']),
        schema: { params: blogIdParamsSchema, body: updateBlogPostSchema }
      },
      blogController.update
    );

    protectedRouter.post(
      '/:id/submit',
      {
        preHandler: authorize(['ADMIN', 'ORGANIZER']),
        schema: { params: blogIdParamsSchema }
      },
      blogController.submitReview
    );

    protectedRouter.post(
      '/:id/comments',
      {
        schema: { params: blogIdParamsSchema, body: blogCommentSchema }
      },
      blogController.addComment
    );
  });

  // Admin
  router.register(async (adminRouter) => {
    adminRouter.addHook('preHandler', authenticate);
    adminRouter.addHook('preHandler', authorize(['ADMIN']));

    adminRouter.get('/pending', blogController.listPendingReview);
    adminRouter.post(
      '/:id/publish',
      { schema: { params: blogIdParamsSchema } },
      blogController.publish
    );
    adminRouter.post(
      '/:id/archive',
      { schema: { params: blogIdParamsSchema } },
      blogController.archive
    );
    adminRouter.get('/comments/pending', blogController.listPendingComments);
    adminRouter.post(
      '/comments/:id/approve',
      { schema: { params: z.object({ id: z.string().uuid() }) } },
      blogController.approveComment
    );
    adminRouter.post(
      '/comments/:id/reject',
      { schema: { params: z.object({ id: z.string().uuid() }) } },
      blogController.rejectComment
    );
  });
}
