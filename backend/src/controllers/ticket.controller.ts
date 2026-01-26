import { FastifyReply, FastifyRequest } from 'fastify';
import { TicketService } from '../services/ticket.service';
import { ReserveTicketInput, ValidateTicketInput } from '../schemas/ticket.schema';

export class TicketController {
  constructor(private ticketService: TicketService) {}

  reserve = async (req: FastifyRequest, reply: FastifyReply) => {
    const { eventId, ticketTypeId } = req.body as ReserveTicketInput;
    const ticket = await this.ticketService.reserveTicket(req.user!.id, eventId, ticketTypeId);
    return reply.status(201).send(ticket);
  };

  getMyTickets = async (req: FastifyRequest, reply: FastifyReply) => {
    const tickets = await this.ticketService.getExplorerTickets(req.user!.id);
    return reply.status(200).send(tickets);
  };

  getById = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const ticket = await this.ticketService.getExplorerTicketById(req.user!.id, id);
    return reply.status(200).send(ticket);
  };

  getEventTickets = async (req: FastifyRequest, reply: FastifyReply) => {
    const { eventId } = req.params as { eventId: string };
    const tickets = await this.ticketService.getEventTicketsForOrganizer(req.user!.id, eventId);
    return reply.status(200).send(tickets);
  };

  getQr = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const qrData = await this.ticketService.getTicketQr(req.user!.id, id);
    return reply.status(200).send(qrData);
  };

  validate = async (req: FastifyRequest, reply: FastifyReply) => {
    const { qrPayload } = req.body as ValidateTicketInput;
    const result = await this.ticketService.validateTicket(req.user!.id, qrPayload);
    // Devolvemos 200 aunque el ticket sea inválido (lógica de negocio), 
    // reservamos 4xx/5xx para errores de protocolo o sistema.
    return reply.status(200).send(result);
  };
}