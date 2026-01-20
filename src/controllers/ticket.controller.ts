import { FastifyReply, FastifyRequest } from 'fastify';
import { TicketService } from '../services/ticket.service';
import { ReserveTicketInput, ValidateTicketInput } from '../schemas/ticket.schema';

export class TicketController {
  constructor(private ticketService: TicketService) {}

  reserve = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as ReserveTicketInput;
    const ticket = await this.ticketService.reserveTicket(req.user!.id, body.eventId);
    return reply.status(201).send(ticket);
  };

  getMyTickets = async (req: FastifyRequest, reply: FastifyReply) => {
    const tickets = await this.ticketService.getExplorerTickets(req.user!.id);
    return reply.status(200).send(tickets);
  };

  getEventTickets = async (req: FastifyRequest, reply: FastifyReply) => {
    const params = req.params as { eventId: string };
    const tickets = await this.ticketService.getEventTicketsForOrganizer(req.user!.id, params.eventId);
    return reply.status(200).send(tickets);
  };

  getQr = async (req: FastifyRequest, reply: FastifyReply) => {
    const params = req.params as { id: string };
    const qrData = await this.ticketService.getTicketQr(req.user!.id, params.id);
    return reply.status(200).send(qrData);
  };

  validate = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as ValidateTicketInput;
    const result = await this.ticketService.validateTicket(req.user!.id, body.qrPayload);
    // Devolvemos 200 aunque el ticket sea inválido (lógica de negocio), 
    // reservamos 4xx/5xx para errores de protocolo o sistema.
    return reply.status(200).send(result);
  };
}