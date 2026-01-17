
import { FastifyReply, FastifyRequest } from 'fastify';
import { TicketService } from '../services/ticket.service';
import { ReserveTicketInput, ValidateTicketInput } from '../schemas/ticket.schema';

export class TicketController {
  constructor(private ticketService: TicketService) {}

  reserve = async (req: FastifyRequest<{ Body: ReserveTicketInput }>, reply: FastifyReply) => {
    const ticket = await this.ticketService.reserveTicket(req.user!.id, req.body.eventId);
    return reply.status(201).send(ticket);
  };

  getMyTickets = async (req: FastifyRequest, reply: FastifyReply) => {
    const tickets = await this.ticketService.getExplorerTickets(req.user!.id);
    return reply.status(200).send(tickets);
  };

  getEventTickets = async (req: FastifyRequest<{ Params: { eventId: string } }>, reply: FastifyReply) => {
    const tickets = await this.ticketService.getEventTicketsForOrganizer(req.user!.id, req.params.eventId);
    return reply.status(200).send(tickets);
  };

  getQr = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const qrData = await this.ticketService.getTicketQr(req.user!.id, req.params.id);
    return reply.status(200).send(qrData);
  };

  validate = async (req: FastifyRequest<{ Body: ValidateTicketInput }>, reply: FastifyReply) => {
    const result = await this.ticketService.validateTicket(req.user!.id, req.body.qrPayload);
    // Devolvemos 200 aunque el ticket sea inválido (lógica de negocio), 
    // reservamos 4xx/5xx para errores de protocolo o sistema.
    return reply.status(200).send(result);
  };
}
