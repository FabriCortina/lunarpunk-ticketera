import { z } from 'zod';

export const createPreferenceSchema = z.object({
  orderId: z.string().uuid()
});

export type CreatePreferenceInput = z.infer<typeof createPreferenceSchema>;
