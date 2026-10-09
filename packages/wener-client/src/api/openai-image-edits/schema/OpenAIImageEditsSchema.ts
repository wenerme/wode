import { z } from 'zod';
import { OpenAIImagesResponseSchema, OpenAIImageUsageSchema } from '../../openai-image-generations/schema';

const wireString = z.string().min(1);
const multipartFile = z.file().meta({ type: 'string', format: 'binary' });
const formBoolean = z.preprocess((value) => {
	if (value === 'true') return true;
	if (value === 'false') return false;
	return value;
}, z.boolean());
const imageReference = z
	.looseObject({
		file_id: z.string().min(1).optional(),
		image_url: z.string().min(1).optional(),
	})
	.refine((value) => Boolean(value.file_id) !== Boolean(value.image_url), 'exactly one image reference is required');

const editOptions = {
	model: wireString,
	prompt: z.string().min(1).max(32_000),
	background: z.enum(['transparent', 'opaque', 'auto']).optional(),
	input_fidelity: z.enum(['high', 'low']).optional(),
	moderation: z.enum(['low', 'auto']).optional(),
	n: z.coerce.number().int().min(1).max(10).optional(),
	output_compression: z.coerce.number().int().min(0).max(100).optional(),
	output_format: z.enum(['png', 'jpeg', 'webp']).optional(),
	partial_images: z.coerce.number().int().min(0).max(3).optional(),
	quality: z.enum(['standard', 'low', 'medium', 'high', 'auto']).optional(),
	response_format: z.enum(['url', 'b64_json']).optional(),
	size: z.string().optional(),
	stream: formBoolean.optional(),
	user: z.string().optional(),
};

export const OpenAIImageEditsRequestSchema = z.looseObject({
	...editOptions,
	images: z.array(imageReference).min(1).max(16),
	mask: imageReference.optional(),
});

export const OpenAIImageEditsMultipartRequestSchema = z.looseObject({
	...editOptions,
	image: z.union([multipartFile, z.array(multipartFile).min(1).max(16)]),
	mask: multipartFile.optional(),
});

export const OpenAIImageEditPartialEventSchema = z.looseObject({
	type: z.literal('image_edit.partial_image'),
	b64_json: z.string(),
	background: z.enum(['transparent', 'opaque', 'auto']),
	created_at: z.number().int().nonnegative(),
	output_format: z.enum(['png', 'jpeg', 'webp']),
	partial_image_index: z.number().int().nonnegative(),
	quality: z.enum(['low', 'medium', 'high', 'auto']),
	size: z.string(),
});

export const OpenAIImageEditCompletedEventSchema = z.looseObject({
	type: z.literal('image_edit.completed'),
	b64_json: z.string(),
	background: z.enum(['transparent', 'opaque', 'auto']),
	created_at: z.number().int().nonnegative(),
	output_format: z.enum(['png', 'jpeg', 'webp']),
	quality: z.enum(['low', 'medium', 'high', 'auto']),
	size: z.string(),
	usage: OpenAIImageUsageSchema,
});

export const OpenAIImageEditStreamEventSchema = z.union([
	OpenAIImageEditPartialEventSchema,
	OpenAIImageEditCompletedEventSchema,
]);

export { OpenAIImagesResponseSchema };

export const OpenAIImageEditsResponseSchema = OpenAIImagesResponseSchema;

export type OpenAIImageEditsRequest = z.infer<typeof OpenAIImageEditsRequestSchema>;
export type OpenAIImageEditsResponse = z.infer<typeof OpenAIImageEditsResponseSchema>;
export type OpenAIImageEditsMultipartRequest = z.infer<typeof OpenAIImageEditsMultipartRequestSchema>;
export type OpenAIImageEditStreamEvent = z.infer<typeof OpenAIImageEditStreamEventSchema>;
