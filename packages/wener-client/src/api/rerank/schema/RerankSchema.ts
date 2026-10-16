import { z } from 'zod';

const wireString = z.string().min(1);

// Jina 风格 /v1/rerank 线协议；apiproxy openai.rerank 端点遵循同一格式
export const RerankUsageSchema = z.looseObject({
	total_tokens: z.number().int().nonnegative(),
	prompt_tokens: z.number().int().nonnegative().optional(),
});
export type RerankUsage = z.infer<typeof RerankUsageSchema>;

export const RerankDocumentSchema = z.union([z.string(), z.looseObject({ text: z.string() })]);
export type RerankDocument = z.infer<typeof RerankDocumentSchema>;

export const RerankRequestSchema = z.looseObject({
	model: wireString,
	query: wireString,
	documents: z.array(RerankDocumentSchema).min(1),
	top_n: z.number().int().positive().optional(),
	return_documents: z.boolean().optional(),
});
export type RerankRequest = z.infer<typeof RerankRequestSchema>;

export const RerankResultSchema = z.looseObject({
	index: z.number().int().nonnegative(),
	relevance_score: z.number(),
	document: z.looseObject({ text: z.string() }).optional(),
});
export type RerankResult = z.infer<typeof RerankResultSchema>;

export const RerankResponseSchema = z.looseObject({
	model: z.string().optional(),
	results: z.array(RerankResultSchema),
	usage: RerankUsageSchema.optional(),
});
export type RerankResponse = z.infer<typeof RerankResponseSchema>;
