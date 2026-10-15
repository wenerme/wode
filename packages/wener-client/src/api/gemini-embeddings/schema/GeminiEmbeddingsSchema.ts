import { z } from 'zod';
import {
	GeminiContentSchema,
	GeminiModalityTokenCountSchema,
} from '../../gemini-generate-content/schema/GeminiGenerateContentSchema';

export const GeminiEmbedContentConfigSchema = z.looseObject({
	title: z.string().optional().describe('Document title'),
	taskType: z.string().optional().describe('Embedding task type'),
	autoTruncate: z.boolean().optional().describe('Auto-truncate long input'),
	outputDimensionality: z.number().multipleOf(1).optional().describe('Output embedding dimensions'),
	documentOcr: z.boolean().optional(),
	audioTrackExtraction: z.boolean().optional(),
});

/** 单条 embedContent 请求；batchEmbedContents 的每个元素复用同一结构并必须携带 model。 */
export const GeminiEmbedContentRequestSchema = z.looseObject({
	model: z.string().min(1).optional().describe('Model identifier'),
	content: GeminiContentSchema.describe('Content to embed'),
	embedContentConfig: GeminiEmbedContentConfigSchema.optional().describe('Embedding settings'),
	/** 已弃用，优先使用 embedContentConfig；仍保留以兼容旧客户端。 */
	taskType: z.string().optional(),
	title: z.string().optional(),
	outputDimensionality: z.number().multipleOf(1).optional(),
});

export const GeminiContentEmbeddingSchema = z.looseObject({
	values: z.array(z.number()).optional().describe('Embedding values'),
	shape: z.array(z.number().multipleOf(1)).optional().describe('Embedding shape'),
});

/** Embedding 响应使用 promptTokenDetails（单数 Token），与 GenerateContent 的 promptTokensDetails 不同。 */
export const GeminiEmbeddingUsageMetadataSchema = z.looseObject({
	promptTokenCount: z.number().multipleOf(1).optional(),
	promptTokenDetails: z.array(GeminiModalityTokenCountSchema).optional(),
});

export const GeminiEmbedContentResponseSchema = z.looseObject({
	embedding: GeminiContentEmbeddingSchema.optional().describe('Generated embedding'),
	usageMetadata: GeminiEmbeddingUsageMetadataSchema.optional().describe('Token usage'),
});

export const GeminiBatchEmbedContentsRequestSchema = z.looseObject({
	requests: z.array(GeminiEmbedContentRequestSchema).describe('Batch embedding requests'),
});

export const GeminiBatchEmbedContentsResponseSchema = z.looseObject({
	embeddings: z.array(GeminiContentEmbeddingSchema).optional().describe('Embeddings in request order'),
	usageMetadata: GeminiEmbeddingUsageMetadataSchema.optional().describe('Token usage'),
});

export type GeminiEmbedContentRequest = z.infer<typeof GeminiEmbedContentRequestSchema>;
export type GeminiEmbedContentResponse = z.infer<typeof GeminiEmbedContentResponseSchema>;
export type GeminiBatchEmbedContentsRequest = z.infer<typeof GeminiBatchEmbedContentsRequestSchema>;
export type GeminiBatchEmbedContentsResponse = z.infer<typeof GeminiBatchEmbedContentsResponseSchema>;
