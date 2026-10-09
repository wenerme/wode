import { z } from 'zod';
import { OpenAIFileSchema } from '../../openai-files/schema/OpenAIFileSchema';

const wireString = z.string().min(1);

export const OpenAIUploadStatusSchema = z.enum(['pending', 'completing', 'completed', 'cancelled']);

export const OpenAIMD5Schema = z.string().regex(/^\s*(?:[A-Fa-f0-9]{32}|[A-Za-z0-9+/]{22}==)?\s*$/);

export const OpenAIUploadSchema = z.looseObject({
	object: z.literal('upload'),
	id: wireString,
	bytes: z.number().int().nonnegative(),
	created_at: z.number().int().nonnegative(),
	expires_at: z.number().int().nonnegative(),
	filename: wireString,
	purpose: wireString,
	status: OpenAIUploadStatusSchema,
	file: OpenAIFileSchema.optional(),
});

export const OpenAIUploadPartSchema = z.looseObject({
	id: wireString,
	object: z.literal('upload.part'),
	created_at: z.number().int().nonnegative(),
	upload_id: wireString,
	bytes: z.number().int().positive(),
});

export type OpenAIUploadStatus = z.infer<typeof OpenAIUploadStatusSchema>;
export type OpenAIMD5 = z.infer<typeof OpenAIMD5Schema>;
export type OpenAIUpload = z.infer<typeof OpenAIUploadSchema>;
export type OpenAIUploadPart = z.infer<typeof OpenAIUploadPartSchema>;
