import { z } from 'zod';
import {
	GeminiContentSchema,
	GeminiModalityTokenCountSchema,
} from '../../gemini-generate-content/schema/GeminiGenerateContentSchema';

export const GeminiEmbedContentConfigSchema = z.looseObject({
	title: z.string().optional(),
	taskType: z.string().optional(),
	autoTruncate: z.boolean().optional(),
	outputDimensionality: z.number().int().positive().optional(),
	documentOcr: z.boolean().optional(),
	audioTrackExtraction: z.boolean().optional(),
});

/** 单条 embedContent 请求；batchEmbedContents 的每个元素复用同一结构并必须携带 model。 */
export const GeminiEmbedContentRequestSchema = z.looseObject({
	model: z.string().min(1).optional(),
	content: GeminiContentSchema,
	embedContentConfig: GeminiEmbedContentConfigSchema.optional(),
	/** 已弃用，优先使用 embedContentConfig；仍保留以兼容旧客户端。 */
	taskType: z.string().optional(),
	title: z.string().optional(),
	outputDimensionality: z.number().int().positive().optional(),
});

export const GeminiContentEmbeddingSchema = z.looseObject({
	values: z.array(z.number()).optional(),
	shape: z.array(z.number().int()).optional(),
});

/** Embedding 响应使用 promptTokenDetails（单数 Token），与 GenerateContent 的 promptTokensDetails 不同。 */
export const GeminiEmbeddingUsageMetadataSchema = z.looseObject({
	promptTokenCount: z.number().int().nonnegative().optional(),
	promptTokenDetails: z.array(GeminiModalityTokenCountSchema).optional(),
});

export const GeminiEmbedContentResponseSchema = z.looseObject({
	embedding: GeminiContentEmbeddingSchema,
	usageMetadata: GeminiEmbeddingUsageMetadataSchema.optional(),
});

export const GeminiBatchEmbedContentsRequestSchema = z.looseObject({
	requests: z.array(GeminiEmbedContentRequestSchema).min(1),
});

export const GeminiBatchEmbedContentsResponseSchema = z.looseObject({
	embeddings: z.array(GeminiContentEmbeddingSchema),
	usageMetadata: GeminiEmbeddingUsageMetadataSchema.optional(),
});

export type GeminiEmbedContentRequest = z.infer<typeof GeminiEmbedContentRequestSchema>;
export type GeminiEmbedContentResponse = z.infer<typeof GeminiEmbedContentResponseSchema>;
export type GeminiBatchEmbedContentsRequest = z.infer<typeof GeminiBatchEmbedContentsRequestSchema>;
export type GeminiBatchEmbedContentsResponse = z.infer<typeof GeminiBatchEmbedContentsResponseSchema>;
