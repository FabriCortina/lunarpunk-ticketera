import { z } from 'zod';

export const reserveTicketSchema = z.object({
  eventId: z.string().uuid(),
});

export const getEventTicketsSchema = z.object({
  eventId: z.string().uuid(),
});

export const getTicketQrSchema = z.object({
  id: z.string().uuid(),
});

export const validateTicketSchema = z.object({
  qrPayload: z.string().min(1, "QR Payload is required"),
});

export type ReserveTicketInput = z.infer<typeof reserveTicketSchema>;
export type ValidateTicketInput = z.infer<typeof validateTicketSchema>;