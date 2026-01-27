import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { AdminService } from '../services/admin.service';
import { AdminController } from '../controllers/admin.controller';

const statusSchema = z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED']);

export async function adminRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();
  const adminService = new AdminService();
  const adminController = new AdminController(adminService);

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
