import { EventRepository } from '../repositories/event.repository';
import { TicketTypeRepository } from '../repositories/ticketType.repository';
import { TicketRepository } from '../repositories/ticket.repository';
import { CreateEventInput, UpdateEventInput } from '../schemas/event.schema';
import { AppError } from '../utils/errors';

export class EventService {
  constructor(
    private eventRepository: EventRepository,
    private ticketTypeRepository: TicketTypeRepository,
    private ticketRepository: TicketRepository
  ) {}

  async createEvent(userId: string, data: CreateEventInput) {
    const hasTicketTypes = !!data.ticketTypes?.length;
    const normalizedTypes = data.ticketTypes?.map((type) => ({
      name: type.name,
      description: type.description,
      price: Number(type.price),
      capacity: Number(type.capacity)
    }));
    const minPrice = hasTicketTypes
      ? Math.min(...(normalizedTypes || []).map((type) => type.price))
      : Number(data.price ?? 0);
    const totalCapacity = hasTicketTypes
      ? (normalizedTypes || []).reduce((sum, type) => sum + type.capacity, 0)
      : Number(data.capacity ?? 0);

    const eventData = {
      organizer_id: userId,
      title: data.title,
      description: data.description,
      datetime: new Date(data.datetime),
      price: minPrice,
      capacity: totalCapacity,
      location: data.location,
      image_url: data.imageUrl,
      is_published: false
    };

    const event = await this.eventRepository.create(eventData);

    if (hasTicketTypes && normalizedTypes) {
      await this.ticketTypeRepository.createMany(event.id, normalizedTypes);
    }

    return this.buildEventResponse(event);
  }

  async getPublishedEvents() {
    const events = await this.eventRepository.findAllPublished();
    return this.buildEventResponses(events);
  }

  async getOrganizerEvents(userId: string) {
    const events = await this.eventRepository.findAllByOrganizer(userId);
    return this.buildEventResponses(events);
  }

  async updateEvent(eventId: string, userId: string, data: UpdateEventInput) {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.organizer_id !== userId) {
      throw new AppError('Forbidden: You do not own this event', 403);
    }

    const updateData: any = { ...data };
    if (data.imageUrl) {
      updateData.image_url = data.imageUrl;
      delete updateData.imageUrl;
    }
    if ('ticketTypes' in updateData) {
      delete updateData.ticketTypes;
    }

    const updated = await this.eventRepository.update(eventId, updateData);
    return this.buildEventResponse(updated);
  }

  async togglePublish(eventId: string, userId: string) {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.organizer_id !== userId) {
      throw new AppError('Forbidden: You do not own this event', 403);
    }

    const updated = await this.eventRepository.update(eventId, {
      is_published: !event.is_published
    });
    return this.buildEventResponse(updated);
  }

  async deleteEvent(eventId: string, userId: string) {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.organizer_id !== userId) {
      throw new AppError('Forbidden: You do not own this event', 403);
    }

    await this.eventRepository.delete(eventId);
  }

  async getOrganizerEventMetrics(eventId: string, userId: string) {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.organizer_id !== userId) {
      throw new AppError('Forbidden: You do not own this event', 403);
    }

    const statusCounts = await this.ticketRepository.getEventStatusCounts(eventId);
    const reserved = statusCounts.PENDING ?? 0;
    const paid = statusCounts.PAID ?? 0;
    const validated = statusCounts.VALIDATED ?? 0;
    const canceled = statusCounts.CANCELED ?? 0;
    const totalTickets = reserved + paid + validated + canceled;
    const purchased = paid + validated;
    const noShow = Math.max(purchased - validated, 0);
    const capacity = Number(event.capacity || 0);
    const occupancyRate = capacity > 0 ? Math.round((purchased / capacity) * 100) : 0;
    const attendanceRate = purchased > 0 ? Math.round((validated / purchased) * 100) : 0;
    const revenue = await this.ticketRepository.getEventRevenue(eventId);
    const uniqueExplorers = await this.ticketRepository.getEventUniqueExplorers(eventId);
    const byTicketType = await this.ticketRepository.getEventTicketTypesBreakdown(eventId);

    return {
      event: {
        id: event.id,
        title: event.title,
        datetime: event.datetime,
        location: event.location,
        capacity: capacity
      },
      counts: {
        reserved,
        paid,
        validated,
        canceled,
        purchased,
        totalTickets,
        uniqueExplorers
      },
      rates: {
        occupancyRate,
        attendanceRate
      },
      revenue,
      noShow,
      byTicketType
    };
  }

  private async buildEventResponse(event: any) {
    const types = await this.ticketTypeRepository.findByEventId(event.id);
    if (types.length === 0) {
      const sold = await this.ticketRepository.countByEventId(event.id);
      return {
        ...event,
        available_tickets: Math.max(Number(event.capacity) - sold, 0),
        ticket_types: []
      };
    }

    const ticketTypes = await Promise.all(
      types.map(async (type) => {
        const sold = await this.ticketRepository.countByTicketTypeId(type.id);
        return {
          ...type,
          available: Math.max(Number(type.capacity) - sold, 0)
        };
      })
    );
    const availableTotal = ticketTypes.reduce((sum, type) => sum + Number(type.available), 0);

    return {
      ...event,
      available_tickets: availableTotal,
      ticket_types: ticketTypes
    };
  }

  private async buildEventResponses(events: any[]) {
    return Promise.all(events.map((event) => this.buildEventResponse(event)));
  }
}
