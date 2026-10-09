import { z } from 'zod';

const wireString = z.string().min(1);
const imageSize = z.union([
	z.literal('auto'),
	z.literal('256x256'),
	z.literal('512x512'),
	z.literal('1024x1024'),
	z.literal('1536x1024'),
	z.literal('1024x1536'),
	z.literal('1792x1024'),
	z.literal('1024x1792'),
	z.string().regex(/^\d+x\d+$/u),
]);

export const OpenAIImageUsageSchema = z.looseObject({
	input_tokens: z.number().int().nonnegative(),
	output_tokens: z.number().int().nonnegative(),
	total_tokens: z.number().int().nonnegative(),
	input_tokens_details: z.looseObject({
		image_tokens: z.number().int().nonnegative(),
		text_tokens: z.number().int().nonnegative(),
	}),
	output_tokens_details: z
		.looseObject({
			image_tokens: z.number().int().nonnegative(),
			text_tokens: z.number().int().nonnegative(),
		})
		.optional(),
});

export const OpenAIImageSchema = z.looseObject({
	b64_json: z.string().optional(),
	revised_prompt: z.string().optional(),
	url: z.url().optional(),
});

export const OpenAIImagesResponseSchema = z.looseObject({
	created: z.number().int().nonnegative(),
	background: z.enum(['transparent', 'opaque']).optional(),
	data: z.array(OpenAIImageSchema).optional(),
	output_format: z.enum(['png', 'jpeg', 'webp']).optional(),
	quality: z.enum(['low', 'medium', 'high']).optional(),
	size: z.string().optional(),
	usage: OpenAIImageUsageSchema.optional(),
});

export const OpenAIImageGenerationsResponseSchema = OpenAIImagesResponseSchema;

export const OpenAIImageGenerationsRequestSchema = z.looseObject({
	model: wireString,
	prompt: z.string().min(1).max(32_000),
	background: z.enum(['transparent', 'opaque', 'auto']).optional(),
	moderation: z.enum(['low', 'auto']).optional(),
	n: z.number().int().min(1).max(10).optional(),
	output_compression: z.number().int().min(0).max(100).optional(),
	output_format: z.enum(['png', 'jpeg', 'webp']).optional(),
	partial_images: z.number().int().min(0).max(3).optional(),
	quality: z.enum(['standard', 'hd', 'low', 'medium', 'high', 'auto']).optional(),
	response_format: z.enum(['url', 'b64_json']).optional(),
	size: imageSize.optional(),
	stream: z.boolean().optional(),
	style: z.enum(['vivid', 'natural']).optional(),
	user: z.string().optional(),
});

export const OpenAIImageGenerationPartialEventSchema = z.looseObject({
	type: z.literal('image_generation.partial_image'),
	b64_json: z.string(),
	background: z.enum(['transparent', 'opaque', 'auto']),
	created_at: z.number().int().nonnegative(),
	output_format: z.enum(['png', 'jpeg', 'webp']),
	partial_image_index: z.number().int().nonnegative(),
	quality: z.enum(['low', 'medium', 'high', 'auto']),
	size: z.string(),
});

export const OpenAIImageGenerationCompletedEventSchema = z.looseObject({
	type: z.literal('image_generation.completed'),
	b64_json: z.string(),
	background: z.enum(['transparent', 'opaque', 'auto']),
	created_at: z.number().int().nonnegative(),
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
