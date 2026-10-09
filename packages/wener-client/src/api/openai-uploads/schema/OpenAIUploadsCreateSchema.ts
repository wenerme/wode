import { z } from 'zod';
import { OpenAICreatePurposeSchema } from '../../openai-files/schema/OpenAIFileSchema';
import { OpenAIUploadSchema } from './OpenAIUploadSchema';

const OpenAIUploadExpirationSchema = z.looseObject({
	anchor: z.literal('created_at'),
	seconds: z.number().int().min(3600).max(2_592_000),
});

export const OpenAIUploadsCreateRequestSchema = z.looseObject({
	bytes: z.number().int().nonnegative(),
	filename: z.string().min(1),
	mime_type: z.string().min(1),
	purpose: OpenAICreatePurposeSchema,
	expires_after: OpenAIUploadExpirationSchema.optional(),
});

export const OpenAIUploadsCreateResponseSchema = OpenAIUploadSchema;

export type OpenAIUploadsCreateRequest = z.infer<typeof OpenAIUploadsCreateRequestSchema>;
export type OpenAIUploadsCreateResponse = z.infer<typeof OpenAIUploadsCreateResponseSchema>;
