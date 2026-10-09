import { z } from 'zod';
import {
	GeminiContentSchema,
	GeminiToolConfigSchema,
	GeminiToolSchema,
	GeminiUsageMetadataSchema,
} from '../../gemini-generate-content/schema/GeminiGenerateContentSchema';

const GeminiCachedContentFields = {
	displayName: z.string().optional(),
	model: z.string().optional(),
	contents: z.array(GeminiContentSchema).optional(),
	systemInstruction: GeminiContentSchema.optional(),
	tools: z.array(GeminiToolSchema).optional(),
	toolConfig: GeminiToolConfigSchema.optional(),
	ttl: z.string().optional(),
	expireTime: z.string().optional(),
	createTime: z.string().optional(),
	updateTime: z.string().optional(),
	usageMetadata: GeminiUsageMetadataSchema.optional(),
} as const;

/** Gemini CachedContent resource returned by the Cached Contents API. */
export const GeminiCachedContentSchema = z.looseObject({
	name: z.string().optional(),
	...GeminiCachedContentFields,
});

/** Create request for Gemini Cached Contents. */
export const GeminiCachedContentCreateRequestSchema = z.looseObject({
	model: z.string().min(1),
	displayName: z.string().optional(),
	contents: z.array(GeminiContentSchema).min(1),
	systemInstruction: GeminiContentSchema.optional(),
	tools: z.array(GeminiToolSchema).optional(),
	toolConfig: GeminiToolConfigSchema.optional(),
	ttl: z.string().optional(),
});

/** Patch request for Gemini Cached Contents. */
export const GeminiCachedContentPatchRequestSchema = z.looseObject({
	cachedContent: GeminiCachedContentSchema,
	updateMask: z.string().optional(),
});

export const GeminiCachedContentListResponseSchema = z.looseObject({
	cachedContents: z.array(GeminiCachedContentSchema).optional(),
	nextPageToken: z.string().optional(),
});

export type GeminiCachedContent = z.infer<typeof GeminiCachedContentSchema>;
export type GeminiCachedContentCreateRequest = z.infer<typeof GeminiCachedContentCreateRequestSchema>;
export type GeminiCachedContentPatchRequest = z.infer<typeof GeminiCachedContentPatchRequestSchema>;
