import { z } from 'zod';
import { OpenAIFileSchema } from './OpenAIFileSchema';

export const OpenAIFilesRetrieveRequestSchema = z.strictObject({
	file_id: z.string().min(1),
});

export const OpenAIFilesRetrieveResponseSchema = OpenAIFileSchema;

export type OpenAIFilesRetrieveRequest = z.infer<typeof OpenAIFilesRetrieveRequestSchema>;
export type OpenAIFilesRetrieveResponse = z.infer<typeof OpenAIFilesRetrieveResponseSchema>;
