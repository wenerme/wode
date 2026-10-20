import { describe, expect, it } from 'vitest';

import {
	executePrompt,
	type PromptProtocol,
	type PromptRequest,
	preparePromptRequest,
	redactPromptRequest,
} from './index';

const encoder = new TextEncoder();

function request(api: PromptProtocol, overrides: Partial<PromptRequest> = {}): PromptRequest {
	return {
		target: { api, baseUrl: 'https://provider.example', apiKey: 'top-secret' },
		model: 'test-model',
		messages: [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }],
		...(api === 'anthropic' ? { maxOutputTokens: 32 } : {}),
		...overrides,
	};
}

function mockFetch(response: Response): typeof fetch {
	return (async () => response) as typeof fetch;
}

function json(body: unknown): Response {
	return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
}

function sse(parts: string[]): Response {
	return new Response(
		new ReadableStream<Uint8Array>({
			start(controller) {
				for (const part of parts) controller.enqueue(encoder.encode(part));
				controller.close();
			},
		}),
		{ headers: { 'content-type': 'text/event-stream' } },
	);
}

function sseData(value: unknown, event?: string): string {
	return `${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(value)}\n\n`;
}

describe('prompt request preparation', () => {
	it('maps aliases to protocol endpoints and authorization headers', () => {
		const openai = preparePromptRequest(request('openai'));
		expect(openai.url).toBe('https://provider.example/v1/chat/completions');
		expect(openai.headers.Authorization).toBe('Bearer top-secret');

		const responses = preparePromptRequest(
			request('openai-response', {
				target: { api: 'openai-response', baseUrl: 'https://provider.example/v1', apiKey: 'key' },
			}),
		);
		expect(responses.url).toBe('https://provider.example/v1/responses');
		expect(responses.headers.Authorization).toBe('Bearer key');

		const anthropic = preparePromptRequest(
			request('anthropic', {
				target: { api: 'anthropic', baseUrl: 'https://provider.example/v1/messages', apiKey: 'key' },
			}),
		);
		expect(anthropic.url).toBe('https://provider.example/v1/messages');
		expect(anthropic.headers).toMatchObject({ 'x-api-key': 'key', 'anthropic-version': '2023-06-01' });

		const gemini = preparePromptRequest(request('gemini', { stream: true }));
		expect(gemini.url).toBe('https://provider.example/v1beta/models/test-model:streamGenerateContent?alt=sse');
		expect(gemini.headers['x-goog-api-key']).toBe('top-secret');
	});

	it('does not put credentials in URLs and redacts all header and URL values', () => {
		const prepared = preparePromptRequest(
			request('openai', {
				target: {
					api: 'openai',
					baseUrl: 'https://user:pass@provider.example/v1?tenant=private',
					apiKey: 'api-secret',
					headers: { 'X-Customer-Token': 'header-secret' },
				},
			}),
		);
		expect(prepared.url).not.toContain('api-secret');
		const redacted = redactPromptRequest(prepared);
		expect(redacted.url).not.toContain('user');
		expect(redacted.url).not.toContain('pass');
		expect(redacted.url).not.toContain('private');
		expect(Object.values(redacted.headers)).toEqual(Object.keys(redacted.headers).map(() => '[REDACTED]'));
	});
});

describe('prompt JSON execution', () => {
	it.each([
		[
			'openai',
			{
				id: 'chat',
				model: 'test-model',
				choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
				usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
			},
		],
		[
			'openai-response',
			{
				id: 'resp',
				model: 'test-model',
				output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'ok' }] }],
				usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
			},
		],
		[
			'anthropic',
			{
				id: 'msg',
				type: 'message',
				role: 'assistant',
				model: 'test-model',
				content: [{ type: 'text', text: 'ok' }],
				stop_reason: 'end_turn',
				usage: { input_tokens: 1, output_tokens: 1 },
			},
		],
		[
			'gemini',
			{
				responseId: 'gem',
				modelVersion: 'test-model',
				candidates: [{ index: 0, content: { role: 'model', parts: [{ text: 'ok' }] }, finishReason: 'STOP' }],
				usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
			},
		],
	] as const)('decodes %s without network access', async (api, body) => {
		const result = await executePrompt(request(api), { fetch: mockFetch(json(body)) });
		expect(result.text).toBe('ok');
		expect(result.response.choices[0]?.message.content[0]).toMatchObject({ type: 'text', text: 'ok' });
		expect(result.usage).toBeDefined();
	});
});

describe('prompt SSE execution', () => {
	it.each([
		[
			'openai',
			[
				sseData({
					id: 'chat',
					model: 'test-model',
					created: 1,
					choices: [{ index: 0, delta: { role: 'assistant', content: 'he' }, finish_reason: null }],
				}),
				sseData({
					id: 'chat',
					model: 'test-model',
					created: 1,
					choices: [{ index: 0, delta: { content: 'llo' }, finish_reason: 'stop' }],
					usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
				}),
				'data: [DONE]\n\n',
			],
		],
		[
			'openai-response',
			[
				sseData(
					{ type: 'response.created', response: { id: 'resp', model: 'test-model', created_at: 1 } },
					'response.created',
				),
				sseData(
					{ type: 'response.output_text.delta', output_index: 0, content_index: 0, delta: 'hello' },
					'response.output_text.delta',
				),
				sseData(
					{
						type: 'response.completed',
						response: {
							id: 'resp',
							model: 'test-model',
							created_at: 1,
							output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'hello' }] }],
							usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
						},
					},
					'response.completed',
				),
			],
		],
		[
			'anthropic',
			[
				sseData(
					{
						type: 'message_start',
						message: {
							id: 'msg',
							type: 'message',
							role: 'assistant',
							model: 'test-model',
							content: [],
							usage: { input_tokens: 1, output_tokens: 0 },
						},
					},
					'message_start',
				),
				sseData(
					{ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
					'content_block_start',
				),
				sseData(
					{ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'hello' } },
					'content_block_delta',
				),
				sseData({ type: 'content_block_stop', index: 0 }, 'content_block_stop'),
				sseData(
					{ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { input_tokens: 1, output_tokens: 1 } },
					'message_delta',
				),
			],
		],
		[
			'gemini',
			[
				sseData({
					responseId: 'gem',
					modelVersion: 'test-model',
					candidates: [{ index: 0, content: { role: 'model', parts: [{ text: 'he' }] } }],
				}),
				sseData({
					candidates: [{ index: 0, content: { role: 'model', parts: [{ text: 'llo' }] }, finishReason: 'STOP' }],
					usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
				}),
			],
		],
	] as const)('parses fragmented %s SSE and emits text once', async (api, frames) => {
		const raw = frames.join('');
		const output: string[] = [];
		const result = await executePrompt(request(api, { stream: true }), {
			fetch: mockFetch(sse([raw.slice(0, 13), raw.slice(13, 71), raw.slice(71)])),
			onText: (text) => output.push(text),
		});
		expect(result.text).toBe('hello');
		expect(output.join('')).toBe('hello');
		expect(result.usage).toBeDefined();
	});

	it('cancels an active reader when the signal aborts', async () => {
		let cancelled = false;
		let reading: (() => void) | undefined;
		const body = new ReadableStream<Uint8Array>({
			pull() {
				reading?.();
			},
			cancel() {
				cancelled = true;
			},
		});
		const controller = new AbortController();
		const pending = executePrompt(request('openai', { stream: true }), {
			fetch: mockFetch(new Response(body)),
			signal: controller.signal,
		});
		await new Promise<void>((resolve) => {
			reading = resolve;
		});
		controller.abort();
		await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
		expect(cancelled).toBe(true);
	});
});
