
import { FastifyReply, FastifyRequest } from 'fastify';
import { EventService } from '../services/event.service';
import { CreateEventInput, UpdateEventInput } from '../schemas/event.schema';

export class EventController {
  constructor(private eventService: EventService) {}

  create = async (req: FastifyRequest<{ Body: CreateEventInput }>, reply: FastifyReply) => {
    // req.user is guaranteed by 'authenticate' middleware
    const event = await this.eventService.createEvent(req.user!.id, req.body);
    return reply.status(201).send(event);
  };

  getPublicEvents = async (req: FastifyRequest, reply: FastifyReply) => {
    const events = await this.eventService.getPublishedEvents();
    return reply.status(200).send(events);
  };

  getMyEvents = async (req: FastifyRequest, reply: FastifyReply) => {
    const events = await this.eventService.getOrganizerEvents(req.user!.id);
    return reply.status(200).send(events);
  };

  update = async (req: FastifyRequest<{ Params: { id: string }, Body: UpdateEventInput }>, reply: FastifyReply) => {
    const event = await this.eventService.updateEvent(req.params.id, req.user!.id, req.body);
    return reply.status(200).send(event);
  };

  togglePublish = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const event = await this.eventService.togglePublish(req.params.id, req.user!.id);
    return reply.status(200).send(event);
  };

  delete = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await this.eventService.deleteEvent(req.params.id, req.user!.id);
    return reply.status(204).send();
  };
}
