import { describe, expect, test } from 'vitest';
import { RerankRequestSchema, RerankResponseSchema } from './RerankSchema';

describe('Rerank schemas', () => {
	test('解析字符串与对象文档请求', () => {
		expect(
			RerankRequestSchema.parse({ model: 'bge-reranker-v2-m3', query: 'q', documents: ['a', 'b'], top_n: 2 }),
		).toMatchObject({ model: 'bge-reranker-v2-m3', top_n: 2 });
		expect(
			RerankRequestSchema.parse({ model: 'm', query: 'q', documents: [{ text: 'a', title: 't' }] }).documents,
		).toEqual([{ text: 'a', title: 't' }]);
	});

	test('拒绝空文档列表与缺失query', () => {
		expect(RerankRequestSchema.safeParse({ model: 'm', query: 'q', documents: [] }).success).toBe(false);
		expect(RerankRequestSchema.safeParse({ model: 'm', documents: ['a'] }).success).toBe(false);
	});

	test('解析含usage的响应', () => {
		expect(
			RerankResponseSchema.parse({
				model: 'baai/bge-reranker-v2-m3',
				results: [{ index: 1, relevance_score: 0.9, document: { text: 'b' } }],
				usage: { total_tokens: 128 },
			}),
		).toMatchObject({ results: [{ index: 1, relevance_score: 0.9 }], usage: { total_tokens: 128 } });
	});
});
