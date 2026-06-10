import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { FastifyBaseLogger } from 'fastify';
import { TicketRepository } from '../repositories/ticket.repository';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { generateSignedQrPayload } from '../utils/crypto';
import { verifyMercadoPagoSignature } from '../utils/mercadopago';

export class PaymentService {
  private mpClient: MercadoPagoConfig;

  constructor(private ticketRepository: TicketRepository) {
    this.mpClient = new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });
  }

  async createPreference(userId: string, orderId: string) {
    const tickets = await this.ticketRepository.findByOrderId(orderId);

    if (tickets.length === 0) {
      throw new AppError('Ticket not found', 404);
    }

    const [ticket] = tickets;

    if (ticket.explorer_id !== userId) {
      throw new AppError('Forbidden: This ticket does not belong to you', 403);
    }

    if (tickets.some((t) => t.status !== 'PENDING')) {
      throw new AppError(`Cannot pay for ticket in status ${ticket.status}`, 400);
    }

    const preference = new Preference(this.mpClient);
    const backUrl = env.FRONTEND_PUBLIC_BASE_URL;
    const notificationUrl = `${env.BACKEND_PUBLIC_BASE_URL}/webhooks/mercadopago`;
    const autoReturn = backUrl.startsWith('https://') ? 'approved' : undefined;

    try {
      const unitPrice = ticket.ticket_type_price ?? ticket.event_price;
      const itemTitle = ticket.ticket_type_name
        ? `${ticket.event_title} - ${ticket.ticket_type_name}`
        : ticket.event_title;
      const itemDescription = ticket.ticket_type_description || ticket.event_description;

      const result = await preference.create({
        body: {
          items: [
            {
              id: ticket.event_id,
              title: itemTitle,
              quantity: tickets.length,
              unit_price: Number(unitPrice),
              currency_id: 'ARS',
              description: itemDescription?.substring(0, 200)
            }
          ],
          external_reference: orderId,
          payer: {
             // email: user.email
          },
          back_urls: {
            success: `${backUrl}?status=success`,
            failure: `${backUrl}?status=failure`,
            pending: `${backUrl}?status=pending`
          },
          ...(autoReturn ? { auto_return: autoReturn } : {}),
          notification_url: notificationUrl,
          metadata: {
            order_id: orderId,
            explorer_id: userId
          }
        }
      });

      if (!result.id || !result.init_point) {
        throw new Error('Failed to create preference with MercadoPago');
      }

      await this.ticketRepository.updateOrderPreference(orderId, result.id);

      return {
        init_point: result.init_point,
        sandbox_init_point: result.sandbox_init_point ?? null
      };

    } catch (error: any) {
      console.error('MercadoPago Error:', error);
      throw new AppError('Error creating payment preference', 500);
    }
  }

  async processWebhook(
    query: any,
    _body: any,
    headers: Record<string, string | string[] | undefined>,
    logger?: FastifyBaseLogger
  ) {
    const topic = query.topic || query.type;
    const id = query.id || query['data.id'];

    if (topic !== 'payment' || !id) {
      return;
    }

    const signature = verifyMercadoPagoSignature(headers, String(id));
    if (!signature.ok) {
      logger?.warn(`Invalid MP webhook signature: ${signature.reason} (requestId: ${signature.requestId})`);
      throw new AppError('Invalid webhook signature', 401);
    }

    if (signature.skipped) {
      logger?.warn('MP webhook signature verification skipped (secret not configured)');
    }

    try {
      const payment = new Payment(this.mpClient);
      const paymentInfo = await payment.get({ id: id });

      const orderId = paymentInfo.external_reference;
      if (!orderId) {
        logger?.warn({ paymentId: id }, 'Payment missing external_reference');
        return;
      }

      if (paymentInfo.status !== 'approved') {
        logger?.info({ paymentId: id, status: paymentInfo.status }, 'Payment not approved');
        return;
      }

      const tickets = await this.ticketRepository.findByOrderId(orderId);
      if (tickets.length === 0) {
        logger?.warn({ orderId, paymentId: id }, 'Order not found for payment');
        return;
      }

      const [ticket] = tickets;

      if (tickets.some((t) => t.mp_payment_id && t.mp_payment_id !== String(id))) {
        logger?.warn({ orderId, paymentId: id }, 'Order already linked to another payment');
        return;
      }

      if (tickets.every((t) => t.status === 'PAID')) {
        logger?.info({ orderId, paymentId: id }, 'Order already PAID');
        return;
      }

      const unitPrice = Number(ticket.ticket_type_price ?? ticket.event_price);
      const expectedAmount = unitPrice * tickets.length;
      const receivedAmount = Number(paymentInfo.transaction_amount);
      if (!Number.isFinite(receivedAmount) || Math.abs(receivedAmount - expectedAmount) > 0.01) {
        logger?.warn({ orderId, paymentId: id, expectedAmount, receivedAmount }, 'Payment amount mismatch');
        return;
      }

      if (paymentInfo.currency_id && paymentInfo.currency_id !== 'ARS') {
        logger?.warn({ orderId, paymentId: id, currency: paymentInfo.currency_id }, 'Payment currency mismatch');
        return;
      }

      if (paymentInfo.metadata?.order_id && paymentInfo.metadata.order_id !== orderId) {
        logger?.warn({ orderId, paymentId: id }, 'Payment metadata order_id mismatch');
        return;
      }

      if (paymentInfo.metadata?.explorer_id && paymentInfo.metadata.explorer_id !== ticket.explorer_id) {
        logger?.warn({ orderId, paymentId: id }, 'Payment metadata explorer_id mismatch');
        return;
      }

      const qrPayloadByTicketId: Record<string, string> = {};
      for (const t of tickets) {
        qrPayloadByTicketId[t.id] = generateSignedQrPayload(t.id, t.event_id);
      }

      const updated = await this.ticketRepository.markGroupAsPaid(orderId, String(id), qrPayloadByTicketId);

      if (updated.length === 0) {
        logger?.info({ orderId, paymentId: id }, 'Order already updated by another process');
        return;
      }

      logger?.info({ orderId, paymentId: id, count: updated.length }, 'Order updated to PAID');
    } catch (error) {
      logger?.error({ err: error, paymentId: id }, 'Error processing MP webhook');
    }
  }
}