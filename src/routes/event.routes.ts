
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

  // PUBLIC / AUTHED (Todos pueden ver eventos publicados)
  router.get('/', eventController.getPublicEvents);

  // ORGANIZER ONLY ROUTES
  router.register(async (protectedRouter) => {
    protectedRouter.addHook('preHandler', authenticate);
    
    // Create Event
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

    // Get My Events
    protectedRouter.get(
      '/mine',
      {
        preHandler: authorize(['ORGANIZER'])
      },
      eventController.getMyEvents
    );

    // Update Event (Ownership check in Service)
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

    // Toggle Publish (Ownership check in Service)
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

    // Delete Event
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
