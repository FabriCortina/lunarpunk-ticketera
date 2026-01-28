import { del, get, post } from '../lib/api';
import { Ticket } from '../types';

export const ticketsService = {
  reserveTicket: async (eventId: string, ticketTypeId?: string): Promise<Ticket> => {
    const ticket = await post<any>('/api/tickets/reserve', { eventId, ticketTypeId });
    return mapTicket(ticket);
  },

  getMyTickets: async (): Promise<Ticket[]> => {
    const tickets = await get<any[]>('/api/tickets/mine');
    return tickets.map(mapTicket);
  },

  getTicketById: async (ticketId: string): Promise<Ticket> => {
    const ticket = await get<any>(`/api/tickets/${ticketId}`);
    return mapTicket(ticket);
  },

  getTicketQr: async (ticketId: string): Promise<{ qrPayload: string | null }> =>
    get(`/api/tickets/${ticketId}/qr`),

  deleteTicket: async (ticketId: string): Promise<void> =>
    del(`/api/tickets/${ticketId}`),

  getEventTickets: async (eventId: string) =>
    get(`/api/tickets/event/${eventId}`),

  validateTicket: async (qrPayload: string) =>
    post('/api/tickets/validate', { qrPayload })
};

const mapTicket = (ticket: any): Ticket => ({
  id: ticket.id,
  eventId: ticket.event_id ?? ticket.eventId,
  explorerId: ticket.explorer_id ?? ticket.explorerId,
  status: ticket.status,
  createdAt: ticket.created_at ?? ticket.createdAt,
  qrPayload: ticket.qrPayload ?? ticket.qr_payload ?? null,
  ticketCode: ticket.ticketCode ?? ticket.id,
  ticketTypeName: ticket.ticket_type_name ?? ticket.ticketTypeName ?? null,
  ticketTypeDescription: ticket.ticket_type_description ?? ticket.ticketTypeDescription ?? null,
  ticketTypePrice: ticket.ticket_type_price ?? ticket.ticketTypePrice ?? null
});
