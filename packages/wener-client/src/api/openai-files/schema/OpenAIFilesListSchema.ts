import { z } from 'zod';
import { OpenAIFileListLimitSchema, OpenAIFileSchema } from './OpenAIFileSchema';

export const OpenAIFilesListRequestSchema = z.looseObject({
	purpose: z.string().min(1).max(128).optional(),
	limit: OpenAIFileListLimitSchema.optional(),
	after: z.string().min(1).optional(),
	order: z.enum(['asc', 'desc']).optional(),
});

export const OpenAIFilesListResponseSchema = z.looseObject({
	object: z.string(),
	data: z.array(OpenAIFileSchema).describe('File list'),
	has_more: z.boolean().describe('More pages available'),
	first_id: z.string().optional(),
	last_id: z.string().optional(),
});

export type OpenAIFilesListRequest = z.infer<typeof OpenAIFilesListRequestSchema>;
export type OpenAIFilesListResponse = z.infer<typeof OpenAIFilesListResponseSchema>;
