import { z } from 'zod';

const ticketTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(3),
  price: z.coerce.number().min(0),
  capacity: z.coerce.number().int().positive()
});

export const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  datetime: z.string().min(1),
  price: z.coerce.number().min(0).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  location: z.string().min(2),
  imageUrl: z.string().url(),
  ticketTypes: z.array(ticketTypeSchema).min(1).optional()
}).superRefine((data, ctx) => {
  const hasTicketTypes = !!data.ticketTypes?.length;
  const hasLegacyFields = data.price !== undefined && data.capacity !== undefined;

  if (!hasTicketTypes && !hasLegacyFields) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Provide price/capacity or ticketTypes.',
      path: ['ticketTypes']
    });
  }
});

export const updateEventSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  datetime: z.string().min(1).optional(),
  price: z.coerce.number().min(0).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  location: z.string().min(2).optional(),
  imageUrl: z.string().url().optional()
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
