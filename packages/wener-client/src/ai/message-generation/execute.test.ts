import { describe, expect, it } from 'vitest';

import { generateMessage } from './execute';
import type { MessageGenerationProtocol, MessageGenerationRequest } from './types';

const encoder = new TextEncoder();

function request(
	api: MessageGenerationProtocol,
	overrides: Partial<MessageGenerationRequest> = {},
): MessageGenerationRequest {
	return {
		target: { api, baseUrl: 'https://provider.example', apiKey: 'top-secret' },
		model: 'test-model',
		messages: [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }],
		...(api === 'anthropic' ? { maxOutputTokens: 32 } : {}),
		...overrides,
	};
}

function mockFetch(response: Response): typeof fetch {
	return (async () => response) as unknown as typeof fetch;
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

describe('message generation JSON execution', () => {
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
		const result = await generateMessage(request(api), { fetch: mockFetch(json(body)) });
		expect(result.text).toBe('ok');
		expect(result.response.choices[0]?.message.content[0]).toMatchObject({ type: 'text', text: 'ok' });
		expect(result.usage).toBeDefined();
	});
});

describe('message generation SSE execution', () => {
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
		const result = await generateMessage(request(api, { stream: true }), {
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
		const pending = generateMessage(request('openai', { stream: true }), {
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

describe('message generation completion integrity', () => {
	const completionRequest: MessageGenerationRequest = {
		target: { api: 'openai', baseUrl: 'https://example.com' },
		model: 'fixture',
		messages: [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }],
		stream: true,
	};
	const completionSse = (frames: unknown[], suffix = '') =>
		new Response(frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join('') + suffix, {
			headers: { 'content-type': 'text/event-stream' },
		});

	it('keeps abort identity when JSON consumption rejects during cancellation', async () => {
		const signal = new AbortController();
		const response = Response.json({});
		response.json = async () => {
			signal.abort();
			throw new DOMException('fixture', 'AbortError');
		};
		await expect(
			generateMessage(
				{ ...completionRequest, stream: false },
				{ signal: signal.signal, fetch: mockFetch(response) },
			),
		).rejects.toMatchObject({ name: 'AbortError' });
	});
	it.each<MessageGenerationProtocol>(['openai', 'openai-response', 'anthropic', 'gemini'])(
		'rejects interrupted %s streams',
		async (api) => {
			const partial =
				api === 'openai'
					? { choices: [{ index: 0, delta: { content: 'partial' }, finish_reason: null }] }
					: api === 'openai-response'
						? { type: 'response.output_text.delta', output_index: 0, content_index: 0, delta: 'partial' }
						: api === 'anthropic'
							? { type: 'content_block_start', index: 0, content_block: { type: 'text', text: 'partial' } }
							: { candidates: [{ index: 0, content: { role: 'model', parts: [{ text: 'partial' }] } }] };
			await expect(
				generateMessage(
					{ ...completionRequest, target: { ...completionRequest.target, api }, maxOutputTokens: 32 },
					{ fetch: mockFetch(completionSse([partial])) },
				),
			).rejects.toThrow('before completion');
		},
	);
	it('rejects HTML, empty events and invalid JSON responses rather than returning empty success', async () => {
		await expect(
			generateMessage(completionRequest, {
				fetch: mockFetch(new Response('<html>fixture</html>', { headers: { 'content-type': 'text/html' } })),
			}),
		).rejects.toThrow('content type');
		await expect(
			generateMessage(completionRequest, { fetch: mockFetch(completionSse([])) }),
		).rejects.toThrow('before completion');
		await expect(
			generateMessage({ ...completionRequest, stream: false }, { fetch: mockFetch(Response.json({})) }),
		).rejects.toThrow('no choices');
	});
	it('accepts a DONE marker and preserves usage trailers after finish events', async () => {
		const result = await generateMessage(completionRequest, {
			fetch: mockFetch(
				completionSse(
					[
						{ choices: [{ index: 0, delta: { content: 'complete' }, finish_reason: 'stop' }] },
						{ choices: [], usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 } },
					],
					'data: [DONE]\n\n',
				),
			),
		});
		expect(result.text).toBe('complete');
		expect(result.usage?.totalTokens).toBe(5);
	});
});

describe('message generation error and stream boundaries', () => {
	const errorRequest: MessageGenerationRequest = {
		target: { api: 'openai', baseUrl: 'https://example.com', apiKey: 'fixture-key' },
		model: 'fixture',
		messages: [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }],
	};

	it('does not surface provider bodies, credentials or low-level network error messages', async () => {
		await expect(
			generateMessage(errorRequest, {
				fetch: mockFetch(Response.json({ error: { message: 'fixture-key' } }, { status: 401 })),
			}),
		).rejects.toThrow('HTTP 401');
		const fetch = (async () => {
			throw new Error('fixture-key https://example.com?token=private');
		}) as unknown as typeof globalThis.fetch;
		await expect(generateMessage(errorRequest, { fetch })).rejects.toThrow(/^Message generation request failed$/);
	});
	it('rejects cancellation that happens during JSON consumption even if the host fetch ignores signals', async () => {
		const controller = new AbortController();
		const response = Response.json({ choices: [{ message: { role: 'assistant', content: 'unused' } }] });
		const responseJson = response.json.bind(response);
		response.json = async () => {
			controller.abort();
			return responseJson();
		};
		await expect(
			generateMessage(errorRequest, { signal: controller.signal, fetch: mockFetch(response) }),
		).rejects.toMatchObject({ name: 'AbortError' });
	});
	it('streams only the selected first choice while preserving all aggregated choices', async () => {
		const output: string[] = [];
		const response = await generateMessage(
			{ ...errorRequest, stream: true },
			{
				fetch: mockFetch(
					sse([
						sseData({
							id: 'fixture',
							choices: [
								{ index: 0, delta: { role: 'assistant', content: 'first' }, finish_reason: 'stop' },
								{ index: 1, delta: { role: 'assistant', content: 'second' }, finish_reason: 'stop' },
							],
						}),
					]),
				),
				onText: (text) => {
					output.push(text);
				},
			},
		);
		expect(output.join('')).toBe('first');
		expect(response.text).toBe('first');
		expect(response.response.choices).toHaveLength(2);
	});
	it('retains Anthropic input usage when later events provide output usage only', async () => {
		const response = await generateMessage(
			{ ...errorRequest, stream: true, maxOutputTokens: 32, target: { api: 'anthropic', baseUrl: 'https://example.com' } },
			{
				fetch: mockFetch(
					sse([
						sseData({
							type: 'message_start',
							message: {
								id: 'fixture',
								type: 'message',
								model: 'fixture',
								role: 'assistant',
								content: [],
								usage: { input_tokens: 2, output_tokens: 0 },
							},
						}),
						sseData({ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 3 } }),
						sseData({ type: 'message_stop' }),
					]),
				),
			},
		);
		expect(response.usage).toMatchObject({ inputTokens: 2, outputTokens: 3 });
	});
	it('cancels the reader when malformed stream data fails decoding', async () => {
		let cancelled = false;
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(encoder.encode('data: invalid-fixture-key\n\n'));
			},
			cancel() {
				cancelled = true;
			},
		});
		await expect(
			generateMessage({ ...errorRequest, stream: true }, { fetch: mockFetch(new Response(body)) }),
		).rejects.toThrow(/^Message generation provider returned invalid stream data$/);
		expect(cancelled).toBe(true);
	});
});
