import { FastifyReply, FastifyRequest } from 'fastify';
import { PaymentService } from '../services/payment.service';
import { CreatePreferenceInput } from '../schemas/payment.schema';

export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  createPreference = async (req: FastifyRequest, reply: FastifyReply) => {
    const { orderId } = req.body as CreatePreferenceInput;
    const result = await this.paymentService.createPreference(req.user!.id, orderId);
    return reply.status(201).send(result);
  };

  handleWebhook = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.paymentService.processWebhook(req.query, req.body, req.headers, req.log);
    return reply.status(200).send({ received: true });
  };
}
