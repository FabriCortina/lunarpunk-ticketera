import { get } from '../lib/api';
import { Event } from '../types';

const mapEvent = (event: any): Event => ({
  id: event.id,
  title: event.title,
  description: event.description,
  dateTime: event.datetime,
  price: event.price,
  location: event.location,
  imageUrl: event.image_url,
  capacity: event.capacity,
  availableTickets: event.capacity,
  isPublished: event.is_published,
  organizerId: event.organizer_id
});

export const eventsService = {
  getPublished: async (): Promise<Event[]> => {
    const events = await get<any[]>('/api/events');
    return events.map(mapEvent);
  }
};
