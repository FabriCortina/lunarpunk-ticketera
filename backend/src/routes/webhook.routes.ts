import { FastifyInstance } from 'fastify';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';
import { TicketRepository } from '../repositories/ticket.repository';

export async function webhookRoutes(app: FastifyInstance) {
  const ticketRepository = new TicketRepository();
  const paymentService = new PaymentService(ticketRepository);
  const paymentController = new PaymentController(paymentService);

  // Ruta PÚBLICA (Sin middleware de autenticación)
  app.post('/mercadopago', paymentController.handleWebhook);
}