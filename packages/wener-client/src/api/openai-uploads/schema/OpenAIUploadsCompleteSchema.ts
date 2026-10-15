import { z } from 'zod';
import { OpenAIMD5Schema, OpenAIUploadSchema } from './OpenAIUploadSchema';

export const OpenAIUploadsCompleteRequestSchema = z.looseObject({
	upload_id: z.string().min(1).optional().describe('Upload identifier from path parameter'),
	part_ids: z.array(z.string()).describe('Part identifiers in concatenation order'),
	md5: OpenAIMD5Schema.optional().describe('MD5 checksum of complete file'),
});

export const OpenAIUploadsCompleteResponseSchema = OpenAIUploadSchema;

export type OpenAIUploadsCompleteRequest = z.infer<typeof OpenAIUploadsCompleteRequestSchema>;
export type OpenAIUploadsCompleteResponse = z.infer<typeof OpenAIUploadsCompleteResponseSchema>;
