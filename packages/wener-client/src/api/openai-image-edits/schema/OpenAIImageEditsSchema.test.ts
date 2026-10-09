import { describe, expect, test } from 'vitest';
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
				prompt: 'Model is required',
				images: [{ file_id: 'file-image' }],
			}).success,
		).toBe(false);
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
