import { TicketRepository } from '../repositories/ticket.repository';
import { EventRepository } from '../repositories/event.repository';
import { AppError } from '../utils/errors';
import { verifyQrPayload } from '../utils/crypto';

export class TicketService {
  constructor(
    private ticketRepository: TicketRepository,
    private eventRepository: EventRepository
  ) {}

  async reserveTicket(userId: string, eventId: string) {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (!event.is_published) {
      throw new AppError('Cannot reserve tickets for unpublished events', 400);
    }

    const soldCount = await this.ticketRepository.countByEventId(eventId);
    if (soldCount >= event.capacity) {
      throw new AppError('Event is sold out', 409);
    }

    // El QR Payload inicial es null hasta que se pague
    return this.ticketRepository.create({
      event_id: eventId,
      explorer_id: userId,
      status: 'PENDING',
    });
  }

  async getExplorerTickets(userId: string) {
    return this.ticketRepository.findByExplorerId(userId);
  }

  async getEventTicketsForOrganizer(organizerId: string, eventId: string) {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.organizer_id !== organizerId) {
      throw new AppError('Forbidden: You do not own this event', 403);
    }

    return this.ticketRepository.findByEventId(eventId);
  }

  async getTicketQr(userId: string, ticketId: string) {
    const ticket = await this.ticketRepository.findByIdWithEvent(ticketId);

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    if (ticket.explorer_id !== userId) {
      throw new AppError('Forbidden: This ticket does not belong to you', 403);
    }

    if (ticket.status !== 'PAID') {
      throw new AppError('QR Code is only available for PAID tickets', 400); 
    }

    return { qrPayload: ticket.qr_payload };
  }

  async validateTicket(organizerId: string, qrPayloadString: string) {
    // 1. Verificar Firma Criptográfica
    const data = verifyQrPayload(qrPayloadString);
    if (!data) {
      throw new AppError('Invalid or tampered QR Code', 400);
    }

    // 2. Buscar Ticket en BD
    const ticket = await this.ticketRepository.findByIdWithEvent(data.ticketId);

    if (!ticket) {
      throw new AppError('Ticket does not exist in the database', 404);
    }

    // 3. Verificar Propiedad del Evento (Seguridad)
    if (ticket.organizer_id !== organizerId) {
      throw new AppError('Forbidden: You are not the organizer of this event', 403);
    }

    // 4. Verificar Estado e Idempotencia
    if (ticket.status === 'VALIDATED') {
       return {
         valid: false,
         message: 'ALREADY USED',
         ticket,
         validatedAt: ticket.validated_at
       };
    }

    if (ticket.status !== 'PAID') {
       return {
         valid: false,
         message: `INVALID STATUS: ${ticket.status}`,
         ticket
       };
    }

    // 5. Actualización Atómica (PAID -> VALIDATED)
    const updatedTicket = await this.ticketRepository.markAsValidated(ticket.id);

    if (!updatedTicket) {
      // Si llegamos aquí, hubo una race condition (otro scanner validó milisegundos antes)
      return {
         valid: false,
         message: 'ALREADY USED (Race Condition)',
         ticket,
         validatedAt: new Date()
      };
    }

    return {
      valid: true,
      message: 'ACCESS GRANTED',
      ticket: updatedTicket
    };
  }
}