import { Event, Ticket, TicketStatus } from './types';

export const MOCK_IDS = {
  ORG_1: 'org_1',
  ORG_2: 'org_2',
  EXP_1: 'exp_1',
  EXP_2: 'exp_2'
};

export const INITIAL_EVENTS: Event[] = [
  // ORGANIZER 1 EVENTS
  {
    id: '1',
    title: 'Moonlight Rave 2077',
    description: 'Baila bajo la luz de la luna sintética en la fiesta más exclusiva del sector 7. Djs cibernéticos y bebidas bioluminiscentes.',
    dateTime: '2077-11-15T22:00',
    price: 150,
    location: 'Cráter Tycho, Base Lunar Alpha',
    imageUrl: 'https://picsum.photos/seed/moon1/800/600',
    availableTickets: 49,
    capacity: 200,
    isPublished: true,
    organizerId: MOCK_IDS.ORG_1
  },
  {
    id: '2',
    title: 'Neon Symphony',
    description: 'Una experiencia orquestal con instrumentos de luz sólida. Siente las vibraciones visuales.',
    dateTime: '2025-12-01T19:30',
    price: 85,
    location: 'Domo de Cristal',
    imageUrl: 'https://picsum.photos/seed/neon2/800/600',
    availableTickets: 200,
    capacity: 300,
    isPublished: false, // Draft event for Org 1
    organizerId: MOCK_IDS.ORG_1
  },
  // ORGANIZER 2 EVENTS
  {
    id: '3',
    title: 'Cyber-Gastronomy Expo',
    description: 'Prueba los sabores del futuro. Impresión de comida 4D y maridaje molecular.',
    dateTime: '2025-10-20T12:00',
    price: 45,
    location: 'Mercado Central del Vacío',
    imageUrl: 'https://picsum.photos/seed/food3/800/600',
    availableTickets: 119,
    capacity: 150,
    isPublished: true,
    organizerId: MOCK_IDS.ORG_2
  },
  {
    id: '4',
    title: 'Zero-G Sports Final',
    description: 'La gran final de Blitzball en gravedad cero. Los mejores atletas del sistema solar compiten por la Copa Nebulosa.',
    dateTime: '2026-05-10T16:00',
    price: 200,
    location: 'Estadio Orbital Delta',
    imageUrl: 'https://picsum.photos/seed/sport4/800/600',
    availableTickets: 500,
    capacity: 500,
    isPublished: true,
    organizerId: MOCK_IDS.ORG_2
  }
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 't1',
    eventId: '1', // Event from Org 1
    explorerId: MOCK_IDS.EXP_1, // Belongs to Explorer 1
    status: TicketStatus.PENDING,
    createdAt: new Date().toISOString(),
    ticketCode: 'LUNAR-TEST-001',
    qrPayload: null
  },
  {
    id: 't2',
    eventId: '3', // Event from Org 2
    explorerId: MOCK_IDS.EXP_2, // Belongs to Explorer 2
    status: TicketStatus.PENDING,
    createdAt: new Date().toISOString(),
    ticketCode: 'LUNAR-TEST-002',
    qrPayload: null
  }
];
