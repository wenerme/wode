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
		file_id: z.string().optional().describe('Image file identifier'),
		image_url: z.string().optional().describe('Image URL'),
	})
	.refine(
		(value) => (value.file_id !== undefined) !== (value.image_url !== undefined),
		'exactly one image reference is required',
	);

const editOptions = {
	model: wireString.describe('Image editing model'),
	prompt: z.string().min(1).max(32_000).describe('Image editing prompt'),
	background: z.enum(['transparent', 'opaque', 'auto']).optional(),
	input_fidelity: z.enum(['high', 'low']).optional(),
	moderation: z.enum(['low', 'auto']).optional(),
	n: z.coerce.number().multipleOf(1).min(1).max(10).optional(),
	output_compression: z.coerce.number().multipleOf(1).min(0).max(100).optional(),
	output_format: z.enum(['png', 'jpeg', 'webp']).optional(),
	partial_images: z.coerce.number().multipleOf(1).min(0).max(3).optional(),
	quality: z.enum(['standard', 'low', 'medium', 'high', 'auto']).optional(),
	response_format: z.enum(['url', 'b64_json']).optional(),
	size: z.string().optional(),
	stream: formBoolean.optional(),
	user: z.string().optional(),
};

export const OpenAIImageEditsRequestSchema = z.looseObject({
	...editOptions,
	model: z.string().nullish().describe('Image editing model'),
	background: editOptions.background.nullable(),
	input_fidelity: editOptions.input_fidelity.nullable(),
	moderation: editOptions.moderation.nullable(),
	n: z.number().multipleOf(1).min(1).max(10).nullish().describe('Number of generated images'),
	output_compression: z.number().multipleOf(1).min(0).max(100).nullish(),
	output_format: editOptions.output_format.nullable(),
	partial_images: z.number().multipleOf(1).min(0).max(3).nullish(),
	quality: z
		.enum(['standard', 'low', 'medium', 'high', 'xhigh', 'max', 'auto'])
		.nullish()
		.describe('Image generation quality'),
	size: z.string().nullish().describe('Image generation size'),
	stream: z.boolean().nullish(),
	images: z.array(imageReference).min(1).max(16).describe('Image references to edit'),
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
	created_at: z.number().multipleOf(1).nonnegative(),
	output_format: z.enum(['png', 'jpeg', 'webp']),
	partial_image_index: z.number().multipleOf(1).nonnegative(),
	quality: z.enum(['low', 'medium', 'high', 'auto']),
	size: z.string(),
});

export const OpenAIImageEditCompletedEventSchema = z.looseObject({
	type: z.literal('image_edit.completed'),
	b64_json: z.string(),
	background: z.enum(['transparent', 'opaque', 'auto']),
	created_at: z.number().multipleOf(1).nonnegative(),
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
