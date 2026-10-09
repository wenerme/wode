import { z } from 'zod';
import { OpenAIFileContentSchema } from './OpenAIFileSchema';

export const OpenAIFilesContentRequestSchema = z.strictObject({
	file_id: z.string().min(1),
});

export const OpenAIFilesContentResponseSchema = OpenAIFileContentSchema;

export type OpenAIFilesContentRequest = z.infer<typeof OpenAIFilesContentRequestSchema>;
export type OpenAIFilesContentResponse = z.infer<typeof OpenAIFilesContentResponseSchema>;
