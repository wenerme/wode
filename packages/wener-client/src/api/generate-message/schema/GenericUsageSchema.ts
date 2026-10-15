import { z } from 'zod';

export type GenericUsage = z.input<typeof GenericUsageSchema>;
export const GenericUsageSchema = z.looseObject({
	// OpenAI /v1/chat/completions
	prompt_tokens: z.number().optional().describe('Input token count'),
	completion_tokens: z.number().optional().describe('Output token count'),
	total_tokens: z.number().optional().describe('Total token count'),

	completion_tokens_details: z
		.looseObject({
			accepted_prediction_tokens: z.number().optional().describe('Accepted prediction token count'),
			audio_tokens: z.number().optional().describe('Audio output token count'),
			reasoning_tokens: z.number().optional().describe('Reasoning output token count'),
			rejected_prediction_tokens: z.number().optional().describe('Rejected prediction token count'),
		})
		.nullish(),

	prompt_tokens_details: z
		.looseObject({
			audio_tokens: z.number().optional().describe('Audio input token count'),
			cached_tokens: z.number().optional().describe('Cached input token count'),
			text_tokens: z.number().optional().describe('Text input token count'),
			image_tokens: z.number().optional().describe('Image input token count'),
		})
		.nullish(),

	// OpenAI response
	input_tokens: z.number().nullish().describe('Input token count'),
	input_tokens_details: z
		.looseObject({
			cached_tokens: z.number().optional().describe('Cached input token count'),
			text_tokens: z.number().optional().describe('Text input token count'),
			image_tokens: z.number().optional().describe('Image input token count'),
		})
		.nullish(),
	output_tokens: z.number().optional().describe('Output token count'),
	output_tokens_details: z
		.looseObject({
			reasoning_tokens: z.number().optional().describe('Reasoning output token count'),
		})
		.nullish(),

	// Anthropic input_tokens, output_tokens
	cache_creation: z
		.looseObject({
			ephemeral_1h_input_tokens: z.number().optional().describe('1-hour cache creation input token count'),
			ephemeral_5m_input_tokens: z.number().optional().describe('5-minute cache creation input token count'),
		})
		.nullish(),

	cache_creation_input_tokens: z.number().nullish().describe('Cache creation input token count'),
	cache_read_input_tokens: z.number().nullish().describe('Cache read input token count'),

	service_tier: z.string().nullish().describe('Service tier'),

	num_search_queries: z.number().nullish().describe('Search query count'),

	cost: z.number().nullish().describe('Request cost'),
});
