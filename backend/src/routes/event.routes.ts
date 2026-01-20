import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { EventController } from '../controllers/event.controller';
import { EventService } from '../services/event.service';
import { EventRepository } from '../repositories/event.repository';
import { createEventSchema, updateEventSchema } from '../schemas/event.schema';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { z } from 'zod';

export async function eventRoutes(app: FastifyInstance) {
  const eventRepository = new EventRepository();
  const eventService = new EventService(eventRepository);
  const eventController = new EventController(eventService);

  const router = app.withTypeProvider<ZodTypeProvider>();

  router.get('/', eventController.getPublicEvents);

  router.register(async (protectedRouter) => {
    protectedRouter.addHook('preHandler', authenticate);

    protectedRouter.post(
      '/',
      {
        preHandler: authorize(['ORGANIZER']),
        schema: {
          body: createEventSchema
        }
      },
      eventController.create
    );

    protectedRouter.get(
      '/mine',
      {
        preHandler: authorize(['ORGANIZER'])
      },
      eventController.getMyEvents
    );

    protectedRouter.patch(
      '/:id',
      {
        preHandler: authorize(['ORGANIZER']),
        schema: {
          params: z.object({ id: z.string().uuid() }),
          body: updateEventSchema
        }
      },
      eventController.update
    );

    protectedRouter.patch(
      '/:id/publish',
      {
        preHandler: authorize(['ORGANIZER']),
        schema: {
          params: z.object({ id: z.string().uuid() })
        }
      },
      eventController.togglePublish
    );

    protectedRouter.delete(
      '/:id',
      {
        preHandler: authorize(['ORGANIZER']),
        schema: {
          params: z.object({ id: z.string().uuid() })
        }
      },
      eventController.delete
    );
  });
}
