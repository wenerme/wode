import { z } from 'zod';

export const GeneralResponse = z.object({
  code: z.number().optional(),
  message: z.string(),
  detail: z.object({}).passthrough().optional(),
  data: z.object({}).passthrough().optional(),
});

export type GeneralResponse = z.infer<typeof GeneralResponse>;
