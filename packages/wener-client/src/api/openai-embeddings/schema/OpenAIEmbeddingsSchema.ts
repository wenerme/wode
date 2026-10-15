import { z } from 'zod';

const wireString = z.string().min(1);

export const OpenAIEmbeddingUsageSchema = z.looseObject({
	prompt_tokens: z.number().multipleOf(1),
	total_tokens: z.number().multipleOf(1),
});
export type OpenAIEmbeddingUsage = z.infer<typeof OpenAIEmbeddingUsageSchema>;

/** llama.cpp-compatible multimodal input; the media marker comes from the model's metadata. */
export const OpenAIEmbeddingMultimodalInputSchema = z.looseObject({
	prompt_string: z.string().describe('Prompt containing provider media markers'),
	multimodal_data: z.array(z.string()).describe('Base64-encoded media payloads'),
});
export type OpenAIEmbeddingMultimodalInput = z.infer<typeof OpenAIEmbeddingMultimodalInputSchema>;

export const OpenAIEmbeddingsRequestSchema = z.looseObject({
	model: wireString,
	input: z.union([
		wireString,
		z.array(wireString).min(1),
		z.array(z.number()),
		z.array(z.array(z.number())),
		OpenAIEmbeddingMultimodalInputSchema,
	]),
	encoding_format: z.enum(['float', 'base64']).optional(),
	dimensions: z.number().multipleOf(1).positive().optional(),
	user: z.string().optional(),
});
export type OpenAIEmbeddingsRequest = z.infer<typeof OpenAIEmbeddingsRequestSchema>;

export const OpenAIEmbeddingSchema = z.looseObject({
	object: z.literal('embedding'),
	// encoding_format=base64 时上游返回字符串
	embedding: z.union([z.array(z.number()), z.string()]),
	index: z.number().multipleOf(1),
});
export type OpenAIEmbedding = z.infer<typeof OpenAIEmbeddingSchema>;

export const OpenAIEmbeddingsResponseSchema = z.looseObject({
	object: z.literal('list'),
	data: z.array(OpenAIEmbeddingSchema),
	model: z.string(),
	usage: OpenAIEmbeddingUsageSchema.optional(),
});
export type OpenAIEmbeddingsResponse = z.infer<typeof OpenAIEmbeddingsResponseSchema>;
