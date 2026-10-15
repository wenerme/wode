import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, test } from 'vitest';
import official from '../../../../tests/api-schema-inclusion/oracles/openai.json';
import {
	OpenAIImageEditStreamEventSchema,
	OpenAIImageEditsMultipartRequestSchema,
	OpenAIImageEditsRequestSchema,
} from './OpenAIImageEditsSchema';

describe('OpenAI Image Edits schemas', () => {
	test('解析JSON图片引用编辑请求', () => {
		expect(
			OpenAIImageEditsRequestSchema.parse({
				model: 'gpt-image-2',
				prompt: 'Add a watercolor effect',
				images: [{ image_url: 'https://example.test/image.png' }],
				mask: { file_id: 'file-mask' },
			}),
		).toMatchObject({ model: 'gpt-image-2', images: [{ image_url: 'https://example.test/image.png' }] });
		expect(
			OpenAIImageEditsRequestSchema.safeParse({
				prompt: 'Model is optional',
				images: [{ file_id: 'file-image' }],
			}).success,
		).toBe(true);
	});

	test('JSON编辑请求保留可空参数，不转换数值或布尔字段', () => {
		const validate = new Ajv2020({ strict: false, validateFormats: false }).compile({
			$defs: official.$defs,
			$ref: '#/$defs/EditImageBodyJsonParam',
		});
		const value = {
			prompt: 'Edit',
			images: [{ file_id: 'file-1' }],
			model: null,
			background: null,
			input_fidelity: null,
			moderation: null,
			n: null,
			output_compression: null,
			output_format: null,
			partial_images: null,
			quality: null,
			size: null,
			stream: null,
			extra: { keep: true },
		};
		expect(validate(value)).toBe(true);
		expect(OpenAIImageEditsRequestSchema.parse(value)).toEqual(value);
		for (const quality of ['xhigh', 'max']) {
			expect(validate({ ...value, quality })).toBe(true);
			expect(OpenAIImageEditsRequestSchema.parse({ ...value, quality })).toEqual({ ...value, quality });
		}
		const emptyId = { ...value, images: [{ file_id: '' }] };
		expect(validate(emptyId)).toBe(true);
		expect(OpenAIImageEditsRequestSchema.parse(emptyId)).toEqual(emptyId);
		for (const images of [[{}], [{ file_id: 'file-1', image_url: 'https://example.test/image.png' }]]) {
			expect(validate({ ...value, images })).toBe(false);
			expect(OpenAIImageEditsRequestSchema.safeParse({ ...value, images }).success).toBe(false);
		}
		expect(OpenAIImageEditsRequestSchema.safeParse({ ...value, n: '2' }).success).toBe(false);
		expect(OpenAIImageEditsRequestSchema.safeParse({ ...value, stream: 'false' }).success).toBe(false);
	});

	test('解析multipart文件和字符串参数', () => {
		const image = new File([new Uint8Array([1, 2, 3])], 'source.png', { type: 'image/png' });
		const parsed = OpenAIImageEditsMultipartRequestSchema.parse({
			model: 'gpt-image-2',
			prompt: 'Edit image',
			image,
			n: '2',
			stream: 'false',
		});
		expect(parsed).toMatchObject({ model: 'gpt-image-2', n: 2, stream: false });
		expect(parsed.image).toBe(image);
	});

	test('解析image edit completed usage event', () => {
		expect(
			OpenAIImageEditStreamEventSchema.parse({
				type: 'image_edit.completed',
				b64_json: 'AA==',
				background: 'opaque',
				created_at: 1,
				output_format: 'png',
				quality: 'high',
				size: '1024x1024',
				usage: {
					input_tokens: 20,
					output_tokens: 10,
					total_tokens: 30,
					input_tokens_details: { image_tokens: 15, text_tokens: 5 },
				},
			}),
		).toMatchObject({ type: 'image_edit.completed', usage: { total_tokens: 30 } });
	});
});
