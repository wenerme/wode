import { z } from 'zod';
import { OpenAICreatePurposeSchema } from '../../openai-files/schema/OpenAIFileSchema';
import { OpenAIUploadSchema } from './OpenAIUploadSchema';

const OpenAIUploadExpirationSchema = z.looseObject({
	anchor: z.literal('created_at'),
	seconds: z.number().multipleOf(1).min(3600).max(2_592_000),
});

export const OpenAIUploadsCreateRequestSchema = z.looseObject({
	bytes: z.number().multipleOf(1).describe('File size in bytes'),
	filename: z.string().describe('File name'),
	mime_type: z.string().describe('File MIME type'),
	purpose: OpenAICreatePurposeSchema.describe('Upload purpose'),
	expires_after: OpenAIUploadExpirationSchema.optional(),
});

export const OpenAIUploadsCreateResponseSchema = OpenAIUploadSchema;

export type OpenAIUploadsCreateRequest = z.infer<typeof OpenAIUploadsCreateRequestSchema>;
export type OpenAIUploadsCreateResponse = z.infer<typeof OpenAIUploadsCreateResponseSchema>;
