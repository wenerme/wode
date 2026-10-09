import { z } from 'zod';
import { OpenAIFileSchema } from '../../openai-files/schema/OpenAIFileSchema';
import { OpenAIMD5Schema, OpenAIUploadSchema } from './OpenAIUploadSchema';

export const OpenAIUploadsCompleteRequestSchema = z.looseObject({
	upload_id: z.string().min(1),
	part_ids: z.array(z.string().min(1)),
	md5: OpenAIMD5Schema.optional(),
});

export const OpenAIUploadsCompleteResponseSchema = OpenAIUploadSchema.extend({
	file: OpenAIFileSchema,
});

export type OpenAIUploadsCompleteRequest = z.infer<typeof OpenAIUploadsCompleteRequestSchema>;
export type OpenAIUploadsCompleteResponse = z.infer<typeof OpenAIUploadsCompleteResponseSchema>;
