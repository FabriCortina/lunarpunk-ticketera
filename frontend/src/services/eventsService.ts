import { get, post, patch, del } from '../lib/api';
import { Event, TicketType, EventMetrics } from '../types';

const mapTicketType = (type: any): TicketType => ({
  id: type.id,
  name: type.name,
  description: type.description,
  price: Number(type.price),
  capacity: Number(type.capacity),
  available: Number(type.available ?? type.capacity ?? 0)
});

const mapEvent = (event: any): Event => {
  const ticketTypes = Array.isArray(event.ticket_types)
    ? event.ticket_types.map(mapTicketType)
    : [];
  const minPrice = ticketTypes.length
    ? Math.min(...ticketTypes.map((type) => type.price))
    : Number(event.price);
  const availableTickets = event.available_tickets !== undefined
    ? Number(event.available_tickets)
    : ticketTypes.length
      ? ticketTypes.reduce((sum, type) => sum + type.available, 0)
      : Number(event.capacity);

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    dateTime: event.datetime,
    price: minPrice,
    location: event.location,
    imageUrl: event.image_url,
    capacity: Number(event.capacity),
    availableTickets,
    isPublished: event.is_published,
    organizerId: event.organizer_id,
    ticketTypes
  };
};

export const eventsService = {
  getPublished: async (): Promise<Event[]> => {
    const events = await get<any[]>('/api/events');
    return events.map(mapEvent);
  },

  getMine: async (): Promise<Event[]> => {
    const events = await get<any[]>('/api/events/mine');
    return events.map(mapEvent);
  },

  create: async (event: Omit<Event, 'organizerId' | 'id'>): Promise<Event> => {
    const created = await post<any>('/api/events', {
      title: event.title,
      description: event.description,
      datetime: event.dateTime,
      price: event.price,
      capacity: event.capacity,
      location: event.location,
      imageUrl: event.imageUrl,
      ticketTypes: event.ticketTypes?.map((type) => ({
        name: type.name,
        description: type.description,
        price: type.price,
        capacity: type.capacity
      }))
    });
    return mapEvent(created);
  },

  update: async (eventId: string, payload: Partial<Event>): Promise<Event> => {
    const updated = await patch<any>(`/api/events/${eventId}`, {
      title: payload.title,
      description: payload.description,
      datetime: payload.dateTime,
      price: payload.price,
      capacity: payload.capacity,
      location: payload.location,
      imageUrl: payload.imageUrl
    });
    return mapEvent(updated);
  },

  togglePublish: async (eventId: string): Promise<Event> => {
    const updated = await patch<any>(`/api/events/${eventId}/publish`);
    return mapEvent(updated);
  },

  remove: async (eventId: string): Promise<void> => {
    await del(`/api/events/${eventId}`);
  },

  getMetrics: async (eventId: string): Promise<EventMetrics> =>
    get<EventMetrics>(`/api/events/${eventId}/metrics`)
};
