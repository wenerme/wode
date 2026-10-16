import { z } from 'zod';
import {
	GeminiContentSchema,
	GeminiGenerateContentRequestSchema,
	GeminiModalityTokenCountSchema,
} from './GeminiGenerateContentSchema';

/** models.generateContentRequest 内嵌请求；上游要求 model 与 path 中的模型一致。 */
export const GeminiCountTokensGenerateContentRequestSchema = GeminiGenerateContentRequestSchema.extend({
	model: z.string().min(1).optional().describe('Model identifier'),
});

/**
 * models/{model}:countTokens 请求。
 * 上游提供 generateContentRequest 时忽略 contents；schema 保留调用方的原始字段。
 */
export const GeminiCountTokensRequestSchema = z.looseObject({
	contents: z.array(GeminiContentSchema).optional().describe('Conversation contents to count'),
	generateContentRequest: GeminiCountTokensGenerateContentRequestSchema.optional().describe(
		'Complete generation request to count',
	),
});

/** proto3 JSON 省略零值，因此 totalTokens 等计数在为 0 时可能缺失。 */
export const GeminiCountTokensResponseSchema = z.looseObject({
	totalTokens: z.number().multipleOf(1).optional().describe('Total input tokens'),
	cachedContentTokenCount: z.number().multipleOf(1).optional().describe('Cached content token count'),
	promptTokensDetails: z.array(GeminiModalityTokenCountSchema).optional(),
	cacheTokensDetails: z.array(GeminiModalityTokenCountSchema).optional(),
});

export type GeminiCountTokensRequest = z.infer<typeof GeminiCountTokensRequestSchema>;
export type GeminiCountTokensResponse = z.infer<typeof GeminiCountTokensResponseSchema>;
