
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';
import { TicketRepository } from '../repositories/ticket.repository';
import { createPreferenceSchema } from '../schemas/payment.schema';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export async function paymentRoutes(app: FastifyInstance) {
  const ticketRepository = new TicketRepository();
  const paymentService = new PaymentService(ticketRepository);
  const paymentController = new PaymentController(paymentService);

  const router = app.withTypeProvider<ZodTypeProvider>();

  router.addHook('preHandler', authenticate);

  router.post(
    '/create-preference',
    {
      preHandler: authorize(['EXPLORER']),
      schema: {
        body: createPreferenceSchema
      }
    },
    paymentController.createPreference
  );
}
