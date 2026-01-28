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

  async createPreference(userId: string, ticketId: string) {
    const ticket = await this.ticketRepository.findByIdWithEvent(ticketId);

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    if (ticket.explorer_id !== userId) {
      throw new AppError('Forbidden: This ticket does not belong to you', 403);
    }

    if (ticket.status !== 'PENDING') {
      throw new AppError(`Cannot pay for ticket in status ${ticket.status}`, 400);
    }

    const preference = new Preference(this.mpClient);
    const backUrl = env.FRONTEND_PUBLIC_BASE_URL;
    const notificationUrl = `${env.BACKEND_PUBLIC_BASE_URL}/webhooks/mercadopago`;

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
              quantity: 1,
              unit_price: Number(unitPrice),
              currency_id: 'ARS',
              description: itemDescription?.substring(0, 200)
            }
          ],
          external_reference: ticket.id,
          payer: {
             // email: user.email 
          },
          back_urls: {
            success: `${backUrl}?status=success`,
            failure: `${backUrl}?status=failure`,
            pending: `${backUrl}?status=pending`
          },
          auto_return: 'approved',
          notification_url: notificationUrl,
          metadata: {
            ticket_id: ticket.id,
            explorer_id: userId
          }
        }
      });

      if (!result.id || !result.init_point) {
        throw new Error('Failed to create preference with MercadoPago');
      }

      await this.ticketRepository.update(ticket.id, {
        mp_preference_id: result.id
      });

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
      logger?.warn({ reason: signature.reason, requestId: signature.requestId }, 'Invalid MP webhook signature');
      throw new AppError('Invalid webhook signature', 401);
    }

    if (signature.skipped) {
      logger?.warn('MP webhook signature verification skipped (secret not configured)');
    }

    try {
      const payment = new Payment(this.mpClient);
      const paymentInfo = await payment.get({ id: id });

      const ticketId = paymentInfo.external_reference;
      if (!ticketId) {
        logger?.warn({ paymentId: id }, 'Payment missing external_reference');
        return;
      }

      if (paymentInfo.status !== 'approved') {
        logger?.info({ paymentId: id, status: paymentInfo.status }, 'Payment not approved');
        return;
      }

      const ticket = await this.ticketRepository.findByIdWithEvent(ticketId);
      if (!ticket) {
        logger?.warn({ ticketId, paymentId: id }, 'Ticket not found for payment');
        return;
      }

      if (ticket.mp_payment_id && ticket.mp_payment_id !== String(id)) {
        logger?.warn({ ticketId, paymentId: id }, 'Ticket already linked to another payment');
        return;
      }

      if (ticket.status === 'PAID') {
        logger?.info({ ticketId, paymentId: id }, 'Ticket already PAID');
        return;
      }

      const expectedAmount = Number(ticket.ticket_type_price ?? ticket.event_price);
      const receivedAmount = Number(paymentInfo.transaction_amount);
      if (!Number.isFinite(receivedAmount) || Math.abs(receivedAmount - expectedAmount) > 0.01) {
        logger?.warn({ ticketId, paymentId: id, expectedAmount, receivedAmount }, 'Payment amount mismatch');
        return;
      }

      if (paymentInfo.currency_id && paymentInfo.currency_id !== 'ARS') {
        logger?.warn({ ticketId, paymentId: id, currency: paymentInfo.currency_id }, 'Payment currency mismatch');
        return;
      }

      if (paymentInfo.metadata?.ticket_id && paymentInfo.metadata.ticket_id !== ticketId) {
        logger?.warn({ ticketId, paymentId: id }, 'Payment metadata ticket_id mismatch');
        return;
      }

      if (paymentInfo.metadata?.explorer_id && paymentInfo.metadata.explorer_id !== ticket.explorer_id) {
        logger?.warn({ ticketId, paymentId: id }, 'Payment metadata explorer_id mismatch');
        return;
      }

      const qrPayload = generateSignedQrPayload(ticketId, ticket.event_id);
      const updated = await this.ticketRepository.markAsPaid(ticketId, {
        mp_payment_id: String(id),
        qr_payload: qrPayload
      });

      if (!updated) {
        logger?.info({ ticketId, paymentId: id }, 'Ticket already updated by another process');
        return;
      }

      logger?.info({ ticketId, paymentId: id }, 'Ticket updated to PAID');
    } catch (error) {
      logger?.error({ err: error, paymentId: id }, 'Error processing MP webhook');
    }
  }
}