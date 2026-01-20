export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole; // Role is now mandatory for access control
  avatar?: string; // Base64 string for profile picture
}

export interface Event {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  price: number;
  location: string;
  capacity: number;
  availableTickets: number;
  imageUrl: string;
  isPublished: boolean;
  organizerId: string;
}

export enum TicketStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  VALIDATED = 'VALIDATED',
  CANCELED = 'CANCELED'
}

export interface Ticket {
  id: string;
  eventId: string;
  explorerId: string; // Reference to EXPLORER user (renamed from buyerId)
  status: TicketStatus; // Renamed from paymentStatus
  createdAt: string; // Renamed from purchaseDate
  qrPayload?: string | null;
  ticketCode?: string;
}

export enum UserRole {
  ORGANIZER = 'ORGANIZER',
  EXPLORER = 'EXPLORER'
}

export interface NavItem {
  label: string;
  role: UserRole;
}