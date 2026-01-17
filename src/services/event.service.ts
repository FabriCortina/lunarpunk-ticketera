
import { EventRepository } from '../repositories/event.repository';
import { CreateEventInput, UpdateEventInput } from '../schemas/event.schema';
import { AppError } from '../utils/errors';

export class EventService {
  constructor(private eventRepository: EventRepository) {}

  async createEvent(userId: string, data: CreateEventInput) {
    // Mapping camelCase schema to snake_case DB
    const eventData = {
      organizer_id: userId,
      title: data.title,
      description: data.description,
      datetime: data.datetime,
      price: data.price,
      capacity: data.capacity,
      location: data.location,
      image_url: data.imageUrl,
      is_published: false // Default draft
    };

    return this.eventRepository.create(eventData);
  }

  async getPublishedEvents() {
    return this.eventRepository.findAllPublished();
  }

  async getOrganizerEvents(userId: string) {
    return this.eventRepository.findAllByOrganizer(userId);
  }

  async updateEvent(eventId: string, userId: string, data: UpdateEventInput) {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Ownership Check
    if (event.organizer_id !== userId) {
      throw new AppError('Forbidden: You do not own this event', 403);
    }

    const updateData: any = { ...data };
    if (data.imageUrl) {
        updateData.image_url = data.imageUrl;
        delete updateData.imageUrl;
    }

    return this.eventRepository.update(eventId, updateData);
  }

  async togglePublish(eventId: string, userId: string) {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.organizer_id !== userId) {
      throw new AppError('Forbidden: You do not own this event', 403);
    }

    return this.eventRepository.update(eventId, {
      is_published: !event.is_published
    });
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
}
