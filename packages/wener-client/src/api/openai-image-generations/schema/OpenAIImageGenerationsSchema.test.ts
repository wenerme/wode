import { describe, expect, test } from 'vitest';
import {
	OpenAIImageGenerationStreamEventSchema,
	OpenAIImageGenerationsRequestSchema,
	OpenAIImagesResponseSchema,
} from './OpenAIImageGenerationsSchema';

describe('OpenAI Image Generations schemas', () => {
	test('解析gpt-image-2任意尺寸生成请求', () => {
		expect(
			OpenAIImageGenerationsRequestSchema.parse({
				model: 'gpt-image-2',
				prompt: 'A precise product photo',
				size: '1536x864',
				quality: 'high',
				output_format: 'webp',
				stream: true,
			}),
		).toMatchObject({ model: 'gpt-image-2', size: '1536x864', stream: true });
		expect(OpenAIImageGenerationsRequestSchema.safeParse({ prompt: 'Model is required' }).success).toBe(false);
	});

	test('解析非流响应和completed stream usage', () => {
		const usage = {
			input_tokens: 50,
			output_tokens: 50,
			total_tokens: 100,
			input_tokens_details: { text_tokens: 10, image_tokens: 40 },
		};
		expect(OpenAIImagesResponseSchema.parse({ created: 1, data: [{ b64_json: 'AA==' }], usage })).toMatchObject({
			usage,
		});
		expect(
			OpenAIImageGenerationStreamEventSchema.parse({
				type: 'image_generation.completed',
				b64_json: 'AA==',
				background: 'opaque',
				created_at: 1,
				output_format: 'png',
				quality: 'high',
				size: '1024x1024',
				usage,
			}),
		).toMatchObject({ type: 'image_generation.completed', usage });
	});
});
