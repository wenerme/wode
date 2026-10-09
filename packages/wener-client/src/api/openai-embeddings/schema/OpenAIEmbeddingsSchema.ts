import { z } from 'zod';

const wireString = z.string().min(1);

export const OpenAIEmbeddingUsageSchema = z.looseObject({
	prompt_tokens: z.number().int().nonnegative(),
	total_tokens: z.number().int().nonnegative(),
});
export type OpenAIEmbeddingUsage = z.infer<typeof OpenAIEmbeddingUsageSchema>;

export const OpenAIEmbeddingsRequestSchema = z.looseObject({
	model: wireString,
	input: z.union([wireString, z.array(wireString).min(1), z.array(z.number()), z.array(z.array(z.number()))]),
	encoding_format: z.enum(['float', 'base64']).optional(),
	dimensions: z.number().int().positive().optional(),
	user: z.string().optional(),
});
export type OpenAIEmbeddingsRequest = z.infer<typeof OpenAIEmbeddingsRequestSchema>;

export const OpenAIEmbeddingSchema = z.looseObject({
	object: z.literal('embedding'),
	// encoding_format=base64 时上游返回字符串
	embedding: z.union([z.array(z.number()), z.string()]),
	index: z.number().int().nonnegative(),
});
export type OpenAIEmbedding = z.infer<typeof OpenAIEmbeddingSchema>;

export const OpenAIEmbeddingsResponseSchema = z.looseObject({
	object: z.literal('list'),
	data: z.array(OpenAIEmbeddingSchema),
	model: z.string(),
	usage: OpenAIEmbeddingUsageSchema.optional(),
});
export type OpenAIEmbeddingsResponse = z.infer<typeof OpenAIEmbeddingsResponseSchema>;
