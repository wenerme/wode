import process from 'node:process';
import { generateText, streamText } from 'ai';
import { describe, expect, test } from 'vitest';
import { type AiRouterFetch, createAiRouter } from '../../src/ai/router';
import { protocols, sdkModel } from './sdk-fixtures';

// Run this file explicitly after authorizing live traffic. No host/model fallback:
// missing environment configuration skips the associated protocol entirely.
const baseURL = process.env.TESTING_AI_BASE_URL;
const models = {
	chat: process.env.TESTING_AI_MODEL_CHAT,
	responses: process.env.TESTING_AI_MODEL_RESPONSES,
	gemini: process.env.TESTING_AI_MODEL_GEMINI,
};

for (const protocol of protocols) {
	if (protocol.name === 'anthropic') continue;
	const name = protocol.name;
	const upstreamModel = models[name];
	describe.skipIf(!baseURL || !upstreamModel)(`live ${name} SDK → Hono → ${name}`, () => {
		for (const streaming of [false, true]) {
			test(streaming ? 'streamText' : 'generateText', async () => {
				const apiKey = process.env.TESTING_AI_API_KEY;
				const headers: Record<string, string> = apiKey ? { authorization: `Bearer ${apiKey}` } : {};
				const app = createAiRouter({
					fetch: globalThis.fetch,
					resolve: async () => ({ api: protocol.api, baseURL: baseURL!, model: upstreamModel!, headers }),
				});
				const bridge: AiRouterFetch = (input, init) => Promise.resolve(app.fetch(new Request(input, init)));
				const request = {
					model: sdkModel(name, bridge),
					prompt: 'Reply with exactly the single word pong.',
					maxOutputTokens: 128,
					maxRetries: 0,
					abortSignal: AbortSignal.timeout(90_000),
				};
				if (streaming) {
					const errors: unknown[] = [];
					const result = streamText({
						...request,
						onError: ({ error }) => {
							errors.push(error);
						},
					});
					let text = '';
					let chunks = 0;
					for await (const chunk of result.textStream) {
						text += chunk;
						chunks++;
					}
					expect(errors).toEqual([]);
					expect(chunks).toBeGreaterThan(0);
					expect(text.trim().toLowerCase()).toContain('pong');
					expect(await result.text).toBe(text);
					expect(await result.finishReason).not.toBe('error');
				} else {
					const result = await generateText(request);
					expect(result.text.trim().toLowerCase()).toContain('pong');
					expect(result.finishReason).not.toBe('error');
				}
			}, 100_000);
		}
	});
}
