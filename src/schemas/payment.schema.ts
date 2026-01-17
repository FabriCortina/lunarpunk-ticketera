
import { z } from 'zod';

export const createPreferenceSchema = z.object({
  ticketId: z.string().uuid(),
});

export type CreatePreferenceInput = z.infer<typeof createPreferenceSchema>;
