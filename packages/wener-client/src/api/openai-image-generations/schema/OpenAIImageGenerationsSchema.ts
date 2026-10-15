import { z } from 'zod';

export const OpenAIImageUsageSchema = z.looseObject({
	input_tokens: z.number().multipleOf(1),
	output_tokens: z.number().multipleOf(1),
	total_tokens: z.number().multipleOf(1),
	input_tokens_details: z.looseObject({
		image_tokens: z.number().multipleOf(1),
		text_tokens: z.number().multipleOf(1),
	}),
	output_tokens_details: z
		.looseObject({
			image_tokens: z.number().multipleOf(1),
			text_tokens: z.number().multipleOf(1),
		})
		.optional(),
});

export const OpenAIImageSchema = z.looseObject({
	b64_json: z.string().optional(),
	revised_prompt: z.string().optional(),
	url: z.url().optional(),
});

export const OpenAIImagesResponseSchema = z.looseObject({
	created: z.number().multipleOf(1),
	background: z.enum(['transparent', 'opaque']).optional(),
	data: z.array(OpenAIImageSchema).optional(),
	output_format: z.enum(['png', 'jpeg', 'webp']).optional(),
	quality: z.enum(['low', 'medium', 'high', 'xhigh', 'max']).optional().describe('Image generation quality'),
	size: z.string().optional().describe('Image generation size'),
	usage: OpenAIImageUsageSchema.optional(),
});

export const OpenAIImageGenerationsResponseSchema = OpenAIImagesResponseSchema;

export const OpenAIImageGenerationsRequestSchema = z.looseObject({
	model: z.string().describe('Image generation model'),
	prompt: z.string().describe('Image prompt'),
	background: z.enum(['transparent', 'opaque', 'auto']).nullish().describe('Image background mode'),
	moderation: z.enum(['low', 'auto']).nullish(),
	n: z.number().multipleOf(1).min(1).max(10).nullish().describe('Number of generated images'),
	output_compression: z.number().multipleOf(1).nullish().describe('Output image compression'),
	output_format: z.enum(['png', 'jpeg', 'webp']).nullish().describe('Output image format'),
	partial_images: z.number().multipleOf(1).min(0).max(3).nullish(),
	quality: z
		.enum(['standard', 'hd', 'low', 'medium', 'high', 'xhigh', 'max', 'auto'])
		.nullish()
		.describe('Image generation quality'),
	response_format: z.enum(['url', 'b64_json']).nullish(),
	size: z.string().nullish().describe('Image generation size'),
	stream: z.boolean().nullish().describe('Stream image response'),
	style: z.enum(['vivid', 'natural']).nullish(),
	user: z.string().optional(),
});

export const OpenAIImageGenerationPartialEventSchema = z.looseObject({
	type: z.literal('image_generation.partial_image'),
	b64_json: z.string(),
	background: z.enum(['transparent', 'opaque', 'auto']),
	created_at: z.number().multipleOf(1).nonnegative(),
	output_format: z.enum(['png', 'jpeg', 'webp']),
	partial_image_index: z.number().multipleOf(1).nonnegative(),
	quality: z.enum(['low', 'medium', 'high', 'auto']),
	size: z.string(),
});

export const OpenAIImageGenerationCompletedEventSchema = z.looseObject({
	type: z.literal('image_generation.completed'),
	b64_json: z.string(),
	background: z.enum(['transparent', 'opaque', 'auto']),
	created_at: z.number().multipleOf(1).nonnegative(),
	output_format: z.enum(['png', 'jpeg', 'webp']),
	quality: z.enum(['low', 'medium', 'high', 'auto']),
	size: z.string(),
	usage: OpenAIImageUsageSchema,
});

export const OpenAIImageGenerationStreamEventSchema = z.union([
	OpenAIImageGenerationPartialEventSchema,
	OpenAIImageGenerationCompletedEventSchema,
]);

export type OpenAIImageUsage = z.infer<typeof OpenAIImageUsageSchema>;
export type OpenAIImageGenerationsRequest = z.infer<typeof OpenAIImageGenerationsRequestSchema>;
export type OpenAIImageGenerationsResponse = z.infer<typeof OpenAIImageGenerationsResponseSchema>;
export type OpenAIImagesResponse = z.infer<typeof OpenAIImagesResponseSchema>;
export type OpenAIImageGenerationStreamEvent = z.infer<typeof OpenAIImageGenerationStreamEventSchema>;
