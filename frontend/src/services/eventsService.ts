import { get, post } from '../lib/api';
import { Event, TicketType, EventMetrics } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const buildUrl = (path: string) => {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured');
  }

  const normalizedBase = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
    const response = await fetch(buildUrl(`/api/events/${eventId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        datetime: payload.dateTime,
        price: payload.price,
        capacity: payload.capacity,
        location: payload.location,
        imageUrl: payload.imageUrl
      })
    });

    if (!response.ok) {
      const message = (await response.text()) || 'No se pudo actualizar el evento.';
      throw new Error(message);
    }

    const updated = await response.json();
    return mapEvent(updated);
  },

  togglePublish: async (eventId: string): Promise<Event> => {
    const response = await fetch(buildUrl(`/api/events/${eventId}/publish`), {
      method: 'PATCH',
      headers: {
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      const message = (await response.text()) || 'No se pudo publicar el evento.';
      throw new Error(message);
    }

    const updated = await response.json();
    return mapEvent(updated);
  },

  remove: async (eventId: string): Promise<void> => {
    const response = await fetch(buildUrl(`/api/events/${eventId}`), {
      method: 'DELETE',
      headers: {
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      const message = (await response.text()) || 'No se pudo eliminar el evento.';
      throw new Error(message);
    }
  },

  getMetrics: async (eventId: string): Promise<EventMetrics> =>
    get<EventMetrics>(`/api/events/${eventId}/metrics`)
};
