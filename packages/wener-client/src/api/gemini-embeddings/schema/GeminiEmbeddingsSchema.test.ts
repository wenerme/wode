import { describe, expect, test } from 'vitest';
import { GeminiCountTokensRequestSchema, GeminiCountTokensResponseSchema } from '../../gemini-generate-content/schema';
import {
	GeminiBatchEmbedContentsRequestSchema,
	GeminiBatchEmbedContentsResponseSchema,
	GeminiEmbedContentRequestSchema,
	GeminiEmbedContentResponseSchema,
} from './GeminiEmbeddingsSchema';

describe('Gemini Embeddings schemas', () => {
	test('解析 embedContent 请求、config 与弃用字段', () => {
		expect(
			GeminiEmbedContentRequestSchema.parse({
				model: 'models/gemini-embedding-001',
				content: { parts: [{ text: 'What is the meaning of life?' }] },
				embedContentConfig: { outputDimensionality: 10, taskType: 'RETRIEVAL_QUERY', autoTruncate: true },
				taskType: 'RETRIEVAL_DOCUMENT',
			}),
		).toMatchObject({ embedContentConfig: { outputDimensionality: 10 } });
		expect(GeminiEmbedContentRequestSchema.safeParse({ model: 'models/x' }).success).toBe(false);
	});

	test('解析单条与批量响应，usage 使用 promptTokenDetails', () => {
		expect(
			GeminiEmbedContentResponseSchema.parse({
				embedding: { values: [0.1, 0.2] },
				usageMetadata: { promptTokenCount: 7, promptTokenDetails: [{ modality: 'TEXT', tokenCount: 7 }] },
			}).usageMetadata,
		).toMatchObject({ promptTokenCount: 7 });
		expect(
			GeminiBatchEmbedContentsResponseSchema.parse({ embeddings: [{ values: [1] }, { values: [2] }] }).embeddings,
		).toHaveLength(2);
	});

	test('batchEmbedContents 至少一个 request', () => {
		expect(GeminiBatchEmbedContentsRequestSchema.safeParse({ requests: [] }).success).toBe(false);
		expect(
			GeminiBatchEmbedContentsRequestSchema.safeParse({
				requests: [{ model: 'models/x', content: { parts: [{ text: 'a' }] } }],
			}).success,
		).toBe(true);
	});
});

describe('Gemini CountTokens schemas', () => {
	test('contents 与 generateContentRequest 二选一', () => {
		const contents = [{ parts: [{ text: 'hello' }] }];
		expect(GeminiCountTokensRequestSchema.safeParse({ contents }).success).toBe(true);
		expect(
			GeminiCountTokensRequestSchema.safeParse({ generateContentRequest: { model: 'models/x', contents } }).success,
		).toBe(true);
		expect(GeminiCountTokensRequestSchema.safeParse({ contents, generateContentRequest: { contents } }).success).toBe(
			false,
		);
		expect(GeminiCountTokensRequestSchema.safeParse({}).success).toBe(false);
		expect(GeminiCountTokensRequestSchema.safeParse({ contents: [] }).success).toBe(false);
		expect(GeminiCountTokensRequestSchema.safeParse({}).error?.issues[0]?.message).toBe(
			'Exactly one of contents or generateContentRequest must be provided',
		);
	});

	test('proto3 JSON 省略零值时 totalTokens 可缺失', () => {
		expect(GeminiCountTokensResponseSchema.parse({})).toEqual({});
		expect(GeminiCountTokensResponseSchema.parse({ totalTokens: 10, cachedContentTokenCount: 2 })).toMatchObject({
			totalTokens: 10,
		});
	});
});
