import { z } from 'zod';

export const ServiceRequestSchema = z.object({
  id: z.string(),
  service: z.string(),
  method: z.string(),
  input: z.any(),
  headers: z.record(z.string()).default({}),
  metadata: z.record(z.any()).default({}),
});
export type ServiceRequest = z.infer<typeof ServiceRequestSchema>;

export const ServiceResponseSchema = z.object({
  id: z.string(),
  output: z.any(),
  status: z.string(),
  code: z.number(),
  ok: z.boolean(),
  description: z.string(),
  headers: z.record(z.string()).default({}),
  metadata: z.record(z.any()).default({}),
});
export type ServiceResponse = z.infer<typeof ServiceResponseSchema>;
