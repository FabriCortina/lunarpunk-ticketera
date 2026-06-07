import { z } from 'zod';

export const generateEventDescriptionSchema = z.object({
  title: z.string().min(1),
  location: z.string().min(1),
  description: z.string().optional().default('')
});

export const suggestEventTitleSchema = z.object({
  theme: z.string().min(1)
});

export type GenerateEventDescriptionInput = z.infer<typeof generateEventDescriptionSchema>;
export type SuggestEventTitleInput = z.infer<typeof suggestEventTitleSchema>;
