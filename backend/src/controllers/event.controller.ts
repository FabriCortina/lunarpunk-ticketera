import { FastifyReply, FastifyRequest } from 'fastify';
import { EventService } from '../services/event.service';
import { CreateEventInput, UpdateEventInput } from '../schemas/event.schema';

export class EventController {
  constructor(private eventService: EventService) {}

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as CreateEventInput;
    // req.user is guaranteed by 'authenticate' middleware
    const event = await this.eventService.createEvent(req.user!.id, body);
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

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = req.body as UpdateEventInput;
    const event = await this.eventService.updateEvent(id, req.user!.id, body);
    return reply.status(200).send(event);
  };

  togglePublish = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const event = await this.eventService.togglePublish(id, req.user!.id);
    return reply.status(200).send(event);
  };

  delete = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    await this.eventService.deleteEvent(id, req.user!.id);
    return reply.status(204).send();
  };
}