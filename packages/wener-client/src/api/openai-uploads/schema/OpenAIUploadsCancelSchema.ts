import { z } from 'zod';
import { OpenAIUploadSchema } from './OpenAIUploadSchema';

export const OpenAIUploadsCancelRequestSchema = z.strictObject({
	upload_id: z.string().min(1),
});

export const OpenAIUploadsCancelResponseSchema = OpenAIUploadSchema;

export type OpenAIUploadsCancelRequest = z.infer<typeof OpenAIUploadsCancelRequestSchema>;
export type OpenAIUploadsCancelResponse = z.infer<typeof OpenAIUploadsCancelResponseSchema>;
