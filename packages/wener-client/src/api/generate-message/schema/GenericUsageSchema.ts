import { z } from 'zod';

export type GenericUsage = z.input<typeof GenericUsageSchema>;
export const GenericUsageSchema = z.looseObject({
	// OpenAI /v1/chat/completions
	prompt_tokens: z.number().describe('输入Token数量'),
	completion_tokens: z.number().describe('输出Token数量'),
	total_tokens: z.number().describe('总Token数量'),

	completion_tokens_details: z
		.looseObject({
			accepted_prediction_tokens: z.number().optional().describe('Tokens from accepted model predictions'),
			audio_tokens: z.number().optional().describe('Tokens used for audio processing'),
			reasoning_tokens: z.number().optional().describe('推理输出Token数量'),
			rejected_prediction_tokens: z.number().optional().describe('Tokens from rejected model predictions'),
		})
		.nullish(),

	prompt_tokens_details: z
		.looseObject({
			audio_tokens: z.number().optional().describe('音频输入Token数量'),
			cached_tokens: z.number().optional().describe('缓存输入Token数量'),
			text_tokens: z.number().optional().describe('文本输入Token数量'),
			image_tokens: z.number().optional().describe('图片输入Token数量'),
		})
		.nullish(),

	// OpenAI response
	input_tokens: z.number().optional().describe('输入Token数量'),
	input_tokens_details: z
		.looseObject({
			cached_tokens: z.number().optional().describe('缓存输入Token数量'),
			text_tokens: z.number().optional().describe('文本输入Token数量'),
			image_tokens: z.number().optional().describe('图片输入Token数量'),
		})
		.optional(),
	output_tokens: z.number().optional().describe('输出Token数量'),
	output_tokens_details: z
		.looseObject({
			reasoning_tokens: z.number().optional().describe('推理输出Token数量'),
		})
		.optional(),

	// Anthropic input_tokens, output_tokens
	cache_creation: z
		.looseObject({
			ephemeral_1h_input_tokens: z.number().default(0).describe('1小时缓存输入Token数'),
			ephemeral_5m_input_tokens: z.number().default(0).describe('5分钟缓存输入Token数'),
		})
		.nullish(),

	cache_creation_input_tokens: z.number().nullish().describe('创建缓存输入Token数'),
	cache_read_input_tokens: z.number().nullish().describe('读取缓存输入Token数'),

	service_tier: z.string().nullish(), // standard, priority, batch

	num_search_queries: z.number().nullish().describe('搜索查询数量'),

	cost: z.number().nullish(), // openrouter cost
});
