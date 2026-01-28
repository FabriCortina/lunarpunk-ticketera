import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { AdminService } from '../services/admin.service';
import { AdminController } from '../controllers/admin.controller';
import { env } from '../config/env';
import db from '../database/connection';
import { AppError } from '../utils/errors';

const statusSchema = z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED']);

export async function adminRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();
  const adminService = new AdminService();
  const adminController = new AdminController(adminService);

  router.post(
    '/bootstrap',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
          secret: z.string().min(1)
        })
      }
    },
    async (req, reply) => {
      if (!env.ADMIN_BOOTSTRAP_SECRET) {
        throw new AppError('Bootstrap disabled', 404);
      }

      const { email, secret } = req.body as { email: string; secret: string };
      if (secret !== env.ADMIN_BOOTSTRAP_SECRET) {
        throw new AppError('Invalid bootstrap secret', 403);
      }

      const existingAdmin = await db('users').where({ role: 'ADMIN' }).first();
      if (existingAdmin) {
        throw new AppError('Admin already exists', 409);
      }

      const user = await db('users').where({ email }).first();
      if (!user) {
        throw new AppError('User not found', 404);
      }

      try {
        await db('users')
          .where({ id: user.id })
          .update({ role: 'ADMIN', status: null });
      } catch (error) {
        req.log.error({ err: error }, 'Bootstrap admin update failed, retrying without status');
        await db('users')
          .where({ id: user.id })
          .update({ role: 'ADMIN' });
      }

      const updated = await db('users')
        .where({ id: user.id })
        .select('id', 'name', 'email', 'role')
        .first();

      return reply.send({ user: updated });
    }
  );

  router.register(async (protectedRouter) => {
    protectedRouter.addHook('preHandler', authenticate);
    protectedRouter.addHook('preHandler', authorize(['ADMIN']));

    protectedRouter.get(
      '/organizers',
      {
        schema: {
          querystring: z.object({ status: statusSchema.optional() })
        }
      },
      adminController.listOrganizers
    );

    protectedRouter.post(
      '/organizers/:id/approve',
      {
        schema: {
          params: z.object({ id: z.string().uuid() })
        }
      },
      adminController.approveOrganizer
    );

    protectedRouter.post(
      '/organizers/:id/reject',
      {
        schema: {
          params: z.object({ id: z.string().uuid() }),
          body: z.object({ reason: z.string().min(3) })
        }
      },
      adminController.rejectOrganizer
    );

    protectedRouter.post(
      '/organizers/:id/suspend',
      {
        schema: {
          params: z.object({ id: z.string().uuid() }),
          body: z.object({ reason: z.string().min(3).optional() }).optional()
        }
      },
      adminController.suspendOrganizer
    );

    protectedRouter.post(
      '/organizers/:id/limits',
      {
        schema: {
          params: z.object({ id: z.string().uuid() }),
          body: z.object({
            max_events: z.number().int().positive().nullable().optional(),
            max_tickets_per_event: z.number().int().positive().nullable().optional(),
            max_monthly_volume: z.number().positive().nullable().optional()
          })
        }
      },
      adminController.updateLimits
    );

    protectedRouter.get('/dashboard', adminController.dashboard);
  });
}
