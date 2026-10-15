import { z } from 'zod';
import { OpenAIFileSchema } from '../../openai-files/schema/OpenAIFileSchema';

export const OpenAIUploadStatusSchema = z.enum(['pending', 'completing', 'completed', 'cancelled', 'expired']);

export const OpenAIMD5Schema = z.string();

export const OpenAIUploadSchema = z.looseObject({
	object: z.literal('upload').optional(),
	id: z.string().describe('Upload identifier'),
	bytes: z.number().multipleOf(1).describe('Upload size in bytes'),
	created_at: z.number().multipleOf(1).describe('Creation time, Unix seconds'),
	expires_at: z.number().multipleOf(1).describe('Expiration time, Unix seconds'),
	filename: z.string().describe('File name'),
	purpose: z.string().describe('Upload purpose'),
	status: OpenAIUploadStatusSchema.describe('Upload status'),
	file: OpenAIFileSchema.nullish(),
});

export const OpenAIUploadPartSchema = z.looseObject({
	id: z.string(),
	object: z.literal('upload.part'),
	created_at: z.number().multipleOf(1).nonnegative(),
	upload_id: z.string(),
	bytes: z.number().multipleOf(1).positive(),
});

export type OpenAIUploadStatus = z.infer<typeof OpenAIUploadStatusSchema>;
export type OpenAIMD5 = z.infer<typeof OpenAIMD5Schema>;
export type OpenAIUpload = z.infer<typeof OpenAIUploadSchema>;
export type OpenAIUploadPart = z.infer<typeof OpenAIUploadPartSchema>;
