import { describe, expect, test } from 'vitest';
import { GeminiGenerateContentRequestSchema, GeminiGenerateContentResponseSchema } from './GeminiGenerateContentSchema';

describe('Gemini GenerateContent schemas', () => {
	test('解析多模态、function tool和generation config请求', () => {
		const request = GeminiGenerateContentRequestSchema.parse({
			contents: [
				{
					role: 'user',
					parts: [
						{ text: 'describe', mediaResolution: { level: 'MEDIA_RESOLUTION_HIGH' } },
						{ inlineData: { mimeType: 'image/png', data: 'AA==' } },
					],
				},
			],
			systemInstruction: { parts: [{ text: 'be concise' }] },
			tools: [
				{
					functionDeclarations: [{ name: 'lookup', parametersJsonSchema: { type: 'object', properties: {} } }],
				},
			],
			toolConfig: {
				functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ['lookup'] },
				includeServerSideToolInvocations: true,
			},
			generationConfig: {
				maxOutputTokens: 256,
				responseMimeType: 'application/json',
				thinkingConfig: { includeThoughts: true, thinkingBudget: 64 },
				audioTimestamp: true,
				enableAffectiveDialog: true,
				routingConfig: { autoMode: {} },
			},
		});

		expect(request).toMatchObject({
			contents: [{ role: 'user' }],
			generationConfig: { maxOutputTokens: 256 },
		});
	});

	test('解析candidate、functionCall和usageMetadata响应', () => {
		const response = GeminiGenerateContentResponseSchema.parse({
			candidates: [
				{
					index: 0,
					content: {
						role: 'model',
						parts: [{ text: 'done' }, { functionCall: { name: 'lookup', args: { id: 1 } } }],
					},
					finishReason: 'STOP',
				},
			],
			usageMetadata: {
				promptTokenCount: 8,
				candidatesTokenCount: 5,
				totalTokenCount: 13,
				thoughtsTokenCount: 2,
			},
			modelVersion: 'gemini-private',
			responseId: 'response-1',
		});

		expect(response).toMatchObject({ usageMetadata: { totalTokenCount: 13 }, modelVersion: 'gemini-private' });
	});

	test('保留扩展字段、未知结束原因及零和负数整数', () => {
		const request = {
			contents: [{ role: 'provider-role', parts: [{ text: 'hi', providerPart: { keep: true } }] }],
			generationConfig: { candidateCount: 0, maxOutputTokens: -1, topK: -2 },
		};
		expect(GeminiGenerateContentRequestSchema.parse(request)).toStrictEqual(request);

		const response = {
			candidates: [{ index: -1, finishReason: 'PROVIDER_FINISHED', content: { parts: [] } }],
			usageMetadata: { promptTokenCount: -1, candidatesTokenCount: 0, totalTokenCount: -1 },
			providerResponse: { keep: true },
		};
		expect(GeminiGenerateContentResponseSchema.parse(response)).toStrictEqual(response);
	});
});
