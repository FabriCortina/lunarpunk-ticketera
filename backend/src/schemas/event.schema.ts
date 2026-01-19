import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  datetime: z.coerce.date(), // Convierte strings ISO a Date automáticamente
  price: z.number().min(0),
  capacity: z.number().int().positive(),
  location: z.string().optional(),
  imageUrl: z.string().url().optional(), // Mapear a image_url en repo
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;