import { describe, expect, test } from 'vitest';
import { OpenAIEmbeddingsRequestSchema, OpenAIEmbeddingsResponseSchema } from './OpenAIEmbeddingsSchema';

describe('OpenAI Embeddings schemas', () => {
	test('preserves multimodal image input and provider extensions without changing the request', () => {
		const request = {
			model: 'multimodal-embedding',
			input: { prompt_string: 'Describe <media>', multimodal_data: ['aW1hZ2U='], provider_field: [null, false] },
			encoding_format: 'float',
		};
		const copy = structuredClone(request);
		expect(OpenAIEmbeddingsRequestSchema.parse(request)).toStrictEqual(copy);
		expect(request).toStrictEqual(copy);
	});

	test('解析字符串与字符串数组输入请求', () => {
		expect(OpenAIEmbeddingsRequestSchema.parse({ model: 'qwen3-embedding-8b', input: 'hello' })).toMatchObject({
			model: 'qwen3-embedding-8b',
			input: 'hello',
		});
		expect(
			OpenAIEmbeddingsRequestSchema.parse({ model: 'qwen3-embedding-8b', input: ['a', 'b'], dimensions: 1024 }),
		).toMatchObject({ input: ['a', 'b'], dimensions: 1024 });
	});

	test('请求保留未知扩展字段', () => {
		const parsed = OpenAIEmbeddingsRequestSchema.parse({
			model: 'qwen3-embedding-8b',
			input: 'hello',
			task_type: 'retrieval.query',
		});
		expect(parsed).toMatchObject({ task_type: 'retrieval.query' });
	});

	test('解析含usage的响应与base64向量', () => {
		expect(
			OpenAIEmbeddingsResponseSchema.parse({
				object: 'list',
				data: [{ object: 'embedding', embedding: [0.1, 0.2], index: 0 }],
				model: 'qwen/qwen3-embedding-8b',
				usage: { prompt_tokens: 8, total_tokens: 8 },
			}),
		).toMatchObject({ usage: { prompt_tokens: 8, total_tokens: 8 } });
		expect(
			OpenAIEmbeddingsResponseSchema.parse({
				object: 'list',
				data: [{ object: 'embedding', embedding: 'AA==', index: 0 }],
				model: 'm',
			}).data[0]?.embedding,
		).toBe('AA==');
	});
});
