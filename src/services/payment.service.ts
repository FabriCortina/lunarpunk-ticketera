
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { TicketRepository } from '../repositories/ticket.repository';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { generateSignedQrPayload } from '../utils/crypto';

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
    const backUrl = `${env.PUBLIC_BASE_URL}`; 

    try {
      const result = await preference.create({
        body: {
          items: [
            {
              id: ticket.event_id,
              title: ticket.event_title,
              quantity: 1,
              unit_price: Number(ticket.event_price),
              currency_id: 'ARS',
              description: ticket.event_description?.substring(0, 200)
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
          notification_url: `${env.PUBLIC_BASE_URL}/webhooks/mercadopago`,
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

      return { init_point: result.init_point };

    } catch (error: any) {
      console.error('MercadoPago Error:', error);
      throw new AppError('Error creating payment preference', 500);
    }
  }

  async processWebhook(query: any, body: any) {
    console.log('🔹 Webhook received:', JSON.stringify(body));

    const topic = query.topic || query.type;
    const id = query.id || query['data.id'];

    if (topic !== 'payment' || !id) {
      return;
    }

    try {
      const payment = new Payment(this.mpClient);
      const paymentInfo = await payment.get({ id: id });

      console.log(`🔹 Payment ${id} status: ${paymentInfo.status}`);

      const ticketId = paymentInfo.external_reference;
      
      if (!ticketId) {
        console.warn('⚠️ Payment missing external_reference (Ticket ID)');
        return;
      }

      if (paymentInfo.status === 'approved') {
        const ticket = await this.ticketRepository.findByIdWithEvent(ticketId);

        if (!ticket) {
            console.error(`❌ Ticket not found for ID: ${ticketId}`);
            return;
        }

        if (ticket.status === 'PAID') {
            console.log(`ℹ️ Ticket ${ticketId} is already PAID. Skipping.`);
            return;
        }

        // Generar QR Payload Seguro con HMAC
        const qrPayload = generateSignedQrPayload(ticketId, ticket.event_id);

        await this.ticketRepository.update(ticketId, {
            status: 'PAID',
            mp_payment_id: id.toString(),
            qr_payload: qrPayload
        });

        console.log(`✅ Ticket ${ticketId} updated to PAID with secure QR.`);
      }

    } catch (error) {
      console.error('❌ Error processing webhook:', error);
    }
  }
}
