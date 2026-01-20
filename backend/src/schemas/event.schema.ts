import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  datetime: z.string().min(1),
  price: z.coerce.number().min(0),
  capacity: z.coerce.number().int().positive(),
  location: z.string().min(2),
  imageUrl: z.string().url()
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
