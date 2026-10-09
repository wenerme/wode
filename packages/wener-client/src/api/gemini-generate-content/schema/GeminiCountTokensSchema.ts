import { z } from 'zod';
import {
	GeminiContentSchema,
	GeminiGenerateContentRequestSchema,
	GeminiModalityTokenCountSchema,
} from './GeminiGenerateContentSchema';

/** models.generateContentRequest 内嵌请求；上游要求 model 与 path 中的模型一致。 */
export const GeminiCountTokensGenerateContentRequestSchema = GeminiGenerateContentRequestSchema.extend({
	model: z.string().min(1).optional(),
});

/**
 * models/{model}:countTokens 请求。
 * `contents` 与 `generateContentRequest` 互斥；只提供 generateContentRequest 时忽略 contents。
 */
export const GeminiCountTokensRequestSchema = z
	.looseObject({
		contents: z.array(GeminiContentSchema).optional(),
		generateContentRequest: GeminiCountTokensGenerateContentRequestSchema.optional(),
	})
	.refine(
		(value) => (value.contents?.length ?? 0) > 0 !== (value.generateContentRequest !== undefined),
		'Exactly one of contents or generateContentRequest must be provided',
	);

/** proto3 JSON 省略零值，因此 totalTokens 等计数在为 0 时可能缺失。 */
export const GeminiCountTokensResponseSchema = z.looseObject({
	totalTokens: z.number().int().nonnegative().optional(),
	cachedContentTokenCount: z.number().int().nonnegative().optional(),
	promptTokensDetails: z.array(GeminiModalityTokenCountSchema).optional(),
	cacheTokensDetails: z.array(GeminiModalityTokenCountSchema).optional(),
});

export type GeminiCountTokensRequest = z.infer<typeof GeminiCountTokensRequestSchema>;
export type GeminiCountTokensResponse = z.infer<typeof GeminiCountTokensResponseSchema>;
