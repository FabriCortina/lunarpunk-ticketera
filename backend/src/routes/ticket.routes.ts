import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { TicketController } from '../controllers/ticket.controller';
import { TicketService } from '../services/ticket.service';
import { TicketRepository } from '../repositories/ticket.repository';
import { EventRepository } from '../repositories/event.repository';
import { reserveTicketSchema, getEventTicketsSchema, getTicketQrSchema, validateTicketSchema } from '../schemas/ticket.schema';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export async function ticketRoutes(app: FastifyInstance) {
  const ticketRepository = new TicketRepository();
  const eventRepository = new EventRepository();
  const ticketService = new TicketService(ticketRepository, eventRepository);
  const ticketController = new TicketController(ticketService);

  const router = app.withTypeProvider<ZodTypeProvider>();

  router.addHook('preHandler', authenticate);

  router.post(
    '/reserve',
    {
      preHandler: authorize(['EXPLORER']),
      schema: {
        body: reserveTicketSchema
      }
    },
    ticketController.reserve
  );

  router.get(
    '/mine',
    {
      preHandler: authorize(['EXPLORER'])
    },
    ticketController.getMyTickets
  );

  router.get(
    '/event/:eventId',
    {
      preHandler: authorize(['ORGANIZER']),
      schema: {
        params: getEventTicketsSchema
      }
    },
    ticketController.getEventTickets
  );

  router.get(
    '/:id/qr',
    {
      preHandler: authorize(['EXPLORER']),
      schema: {
        params: getTicketQrSchema
      }
    },
    ticketController.getQr
  );

  // ORGANIZER: Validar Ticket (Scan QR)
  router.post(
    '/validate',
    {
      preHandler: authorize(['ORGANIZER']),
      schema: {
        body: validateTicketSchema
      }
    },
    ticketController.validate
  );
}