import { z } from 'zod';
import {
	OpenAIResponseInputItemSchema,
	OpenAIResponseItemSchema,
	OpenAIResponseUsageSchema,
} from '../../openai-responses/schema';

export const OpenAIResponsesCompactRequestSchema = z.looseObject({
	model: z.string().nullish().describe('Model identifier'),
	input: z
		.union([z.string(), z.array(OpenAIResponseInputItemSchema)])
		.nullish()
		.describe('Input items to compact'),
	instructions: z.string().nullish().describe('Compaction instructions'),
	prompt_cache_key: z.string().nullish().describe('Prompt cache key'),
	service_tier: z.string().nullish().describe('Service tier'),
});

export const OpenAIResponsesCompactResponseSchema = z.looseObject({
	id: z.string().describe('Compaction response identifier'),
	object: z.literal('response.compaction'),
	created_at: z.number().multipleOf(1).describe('Creation time, Unix seconds'),
	output: z.array(OpenAIResponseItemSchema).describe('Compacted output items'),
	usage: OpenAIResponseUsageSchema.describe('Token usage'),
});

export type OpenAIResponsesCompactRequest = z.infer<typeof OpenAIResponsesCompactRequestSchema>;
export type OpenAIResponsesCompactResponse = z.infer<typeof OpenAIResponsesCompactResponseSchema>;
