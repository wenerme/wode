import { z } from 'zod';

export const OpenAIFilesDeleteRequestSchema = z.strictObject({
	file_id: z.string().min(1),
});

export const OpenAIFilesDeleteResponseSchema = z.looseObject({
	id: z.string().min(1),
	object: z.literal('file'),
	deleted: z.boolean(),
});

export type OpenAIFilesDeleteRequest = z.infer<typeof OpenAIFilesDeleteRequestSchema>;
export type OpenAIFilesDeleteResponse = z.infer<typeof OpenAIFilesDeleteResponseSchema>;
