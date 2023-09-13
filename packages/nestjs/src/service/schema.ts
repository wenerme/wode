import { z } from 'zod';

export const ServiceRequestSchema = z.object({
  id: z.string(),
  service: z.string(),
  method: z.string(),
  headers: z.record(z.string()).default({}),
  body: z.any(),
  metadata: z.record(z.any()).default({}),
});
export type ServiceRequest = z.infer<typeof ServiceRequestSchema>;

export const ServiceResponseSchema = z.object({
  id: z.string(),
  status: z.number(), // 207 Multi-Status
  code: z.number().or(z.string()).default(0).optional(),
  ok: z.boolean(),
  description: z.string(),
  headers: z.record(z.string()).default({}),
  body: z.any(),
  metadata: z.record(z.any()).default({}),
  // done: z.boolean().optional(), // for many responses
});
export type ServiceResponse = z.infer<typeof ServiceResponseSchema>;
