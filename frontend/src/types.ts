export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole; // Role is now mandatory for access control
  avatar?: string; // Base64 string for profile picture
  status?: OrganizerStatus | null;
  limits?: OrganizerLimits | null;
  cuitCuil?: string | null;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  price: number;
  location: string;
  imageUrl: string;
  availableTickets: number;
  capacity: number;
  isPublished: boolean;
  organizerId: string;
  ticketTypes?: TicketType[];
}

export interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  available: number;
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
  ticketTypeName?: string | null;
  ticketTypeDescription?: string | null;
  ticketTypePrice?: number | null;
}

export enum UserRole {
  ORGANIZER = 'ORGANIZER',
  EXPLORER = 'EXPLORER',
  ADMIN = 'ADMIN'
}

export type OrganizerStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface OrganizerLimits {
  max_events?: number | null;
  max_tickets_per_event?: number | null;
  max_monthly_volume?: number | null;
}

export interface OrganizerSummary {
  id: string;
  name: string;
  email: string;
  created_at: string;
  status: OrganizerStatus | null;
  approved_at?: string | null;
  approved_by_admin_id?: string | null;
  rejection_reason?: string | null;
  limits?: OrganizerLimits | null;
}

export interface AdminDashboardData {
  kpis: {
    organizers: number;
    organizersPending: number;
    events: number;
    tickets: number;
    revenue: number;
    anchoring: number;
  };
  recentTickets: Array<{
    id: string;
    status: string;
    created_at: string;
    mp_payment_id?: string | null;
    event_title?: string | null;
    explorer_email?: string | null;
    amount?: number | null;
  }>;
  recentPayments: Array<{
    id: string;
    created_at: string;
    mp_payment_id?: string | null;
    event_title?: string | null;
    explorer_email?: string | null;
    amount?: number | null;
  }>;
  antifraudFlags: Array<{
    id: string;
    created_at: string;
    event_title?: string | null;
    explorer_email?: string | null;
  }>;
}

export interface EventMetrics {
  event: {
    id: string;
    title: string;
    datetime: string;
    location: string;
    capacity: number;
  };
  counts: {
    reserved: number;
    paid: number;
    validated: number;
    canceled: number;
    purchased: number;
    totalTickets: number;
    uniqueExplorers: number;
  };
  rates: {
    occupancyRate: number;
    attendanceRate: number;
  };
  revenue: number;
  noShow: number;
  byTicketType: Array<{
    id: string;
    name: string;
    price: number;
    count: number;
  }>;
}

export interface TicketValidationResult {
  valid: boolean;
  message: string;
  validatedAt?: string;
  buyer?: {
    name: string | null;
    email: string | null;
    cuitCuil: string | null;
  };
}

export interface NavItem {
  label: string;
  role: UserRole;
}

export type BlogPostStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type BlogCommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image_url?: string | null;
  status: BlogPostStatus;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string | null;
  author_email?: string | null;
  categories?: BlogCategory[];
  tags?: BlogTag[];
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  status: BlogCommentStatus;
  created_at: string;
  author_name?: string | null;
  author_email?: string | null;
  post_title?: string | null;
}
