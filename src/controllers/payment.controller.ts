import { FastifyReply, FastifyRequest } from 'fastify';
import { PaymentService } from '../services/payment.service';
import { CreatePreferenceInput } from '../schemas/payment.schema';

export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  createPreference = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as CreatePreferenceInput;
    const { ticketId } = body;
    const result = await this.paymentService.createPreference(req.user!.id, ticketId);
    return reply.status(200).send(result);
  };

  handleWebhook = async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as any;
    const body = req.body as any;
    
    // Ejecutar en background (o await si queremos garantizar consistencia antes de responder 200)
    // MercadoPago espera un 200 OK rápido.
    await this.paymentService.processWebhook(query, body);

    return reply.status(200).send({ status: 'received' });
  };
}