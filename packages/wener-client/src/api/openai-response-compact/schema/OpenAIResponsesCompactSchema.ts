import { z } from 'zod';
import {
	OpenAIResponseInputItemSchema,
	OpenAIResponseItemSchema,
	OpenAIResponseUsageSchema,
} from '../../openai-responses/schema';

export const OpenAIResponsesCompactRequestSchema = z.looseObject({
	model: z.string().min(1),
	input: z.union([z.string(), z.array(OpenAIResponseInputItemSchema)]).nullish(),
	instructions: z.string().nullish(),
	prompt_cache_key: z.string().nullish(),
	service_tier: z.string().nullish(),
});

export const OpenAIResponsesCompactResponseSchema = z.looseObject({
	id: z.string().min(1),
	object: z.literal('response.compaction'),
	created_at: z.number().int().nonnegative(),
	output: z.array(OpenAIResponseItemSchema),
	usage: OpenAIResponseUsageSchema,
});

export type OpenAIResponsesCompactRequest = z.infer<typeof OpenAIResponsesCompactRequestSchema>;
export type OpenAIResponsesCompactResponse = z.infer<typeof OpenAIResponsesCompactResponseSchema>;
