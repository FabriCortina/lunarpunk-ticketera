import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';
import { TicketRepository } from '../repositories/ticket.repository';

export async function webhookRoutes(app: FastifyInstance) {
  const ticketRepository = new TicketRepository();
  const paymentService = new PaymentService(ticketRepository);
  const paymentController = new PaymentController(paymentService);

  const router = app.withTypeProvider<ZodTypeProvider>();

  router.post(
    '/mercadopago',
    {
      config: {
        rateLimit: {
          max: 120,
          timeWindow: '1 minute'
        }
      },
      schema: {
        querystring: z.object({
          id: z.string().optional(),
          topic: z.string().optional(),
          type: z.string().optional(),
          'data.id': z.string().optional()
        }).passthrough()
      }
    },
    paymentController.handleWebhook
  );
}
