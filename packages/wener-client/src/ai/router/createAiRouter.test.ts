import { describe, expect, it, vi } from 'vitest';
import { ApiType } from '../../api/schema/ApiType';
import { createAiRouter } from './createAiRouter';
import { createAiRouterFetch } from './createAiRouterFetch';
import type { AiRouterFetch } from './types';

const API = ApiType.OpenAIChatCompletions;
const payload = { model: 'alias', messages: [{ role: 'user', content: 'hello' }] };
const post = (body: unknown = payload, signal?: AbortSignal) =>
	new Request('http://router.test/v1/chat/completions', {
		method: 'POST',
		headers: { 'content-type': 'application/json', authorization: 'Bearer client-only' },
		body: typeof body === 'string' ? body : JSON.stringify(body),
		signal,
	});
const upstream = { api: API, baseURL: 'http://upstream.test/deployment/v1', model: 'upstream-model' };

function chunk(content: string) {
	return {
		id: 'chatcmpl_test',
		object: 'chat.completion.chunk',
		created: 1,
		model: 'upstream-model',
		choices: [{ index: 0, delta: { role: 'assistant', content }, finish_reason: null }],
	};
}

describe('AI router HTTP lifecycle', () => {
	it('provides a Fetch-compatible bridge for SDK URL/init calls', async () => {
		const app = createAiRouter({ resolve: () => new Response('intercepted') });
		const sdkFetch = createAiRouterFetch(app);
		const response = await sdkFetch('http://router.test/v1/chat/completions', {
			method: 'POST',
			body: JSON.stringify(payload),
		});
		expect(await response.text()).toBe('intercepted');
	});

	it('encodes local request failures in the client protocol', async () => {
		const app = createAiRouter({
			resolve: () => ({ api: ApiType.AnthropicMessages, baseURL: 'http://upstream.test' }),
		});
		const response = await app.request('/v1/messages', {
			method: 'POST',
			body: JSON.stringify({ model: 'm', messages: [{ role: 'user', content: 'hello' }] }),
		});
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({
			type: 'error',
			error: { type: 'invalid_request_error', message: 'Request conversion failed' },
		});
	});

	it('also encodes malformed Anthropic JSON as a native client error', async () => {
		const app = createAiRouter({ resolve: () => upstream });
		const response = await app.request('/v1/messages', { method: 'POST', body: '{' });
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({
			type: 'error',
			error: { type: 'invalid_request_error', message: 'Invalid request body' },
		});
	});

	it('resolves aliases, preserves deployment prefixes and isolates upstream credentials', async () => {
		const fetchUpstream = vi.fn<AiRouterFetch>(async (input, init) => {
			expect(String(input)).toBe('http://upstream.test/deployment/v1/chat/completions');
			expect(new Headers(init?.headers).get('authorization')).toBe('Bearer upstream-only');
			expect(JSON.parse(String(init?.body)).model).toBe('upstream-model');
			return Response.json({
				id: 'chatcmpl_test',
				object: 'chat.completion',
				created: 1,
				model: 'upstream-model',
				choices: [{ index: 0, message: { role: 'assistant', content: 'hello' }, finish_reason: 'stop' }],
			});
		});
		const app = createAiRouter({
			resolve: ({ model }) => {
				expect(model).toBe('alias');
				return { ...upstream, headers: { authorization: 'Bearer upstream-only' } };
			},
			fetch: fetchUpstream,
		});
		const response = await app.fetch(post());
		expect(response.status).toBe(200);
		expect((await response.json()).choices[0].message.content).toBe('hello');
		expect(fetchUpstream).toHaveBeenCalledTimes(1);
	});

	it('allows resolver and request hooks to short-circuit without contacting upstream', async () => {
		const fetchUpstream = vi.fn<AiRouterFetch>();
		const denied = createAiRouter({ resolve: () => new Response('denied', { status: 403 }), fetch: fetchUpstream });
		expect((await denied.fetch(post())).status).toBe(403);
		const cached = createAiRouter({
			resolve: () => upstream,
			onRequest: () => new Response('cached'),
			fetch: fetchUpstream,
		});
		expect(await (await cached.fetch(post())).text()).toBe('cached');
		expect(fetchUpstream).not.toHaveBeenCalled();
	});

	it('rejects invalid JSON and unrelated routes before resolution', async () => {
		const resolve = vi.fn(() => upstream);
		const app = createAiRouter({ resolve });
		expect((await app.fetch(post('{'))).status).toBe(400);
		expect((await app.fetch(post([]))).status).toBe(400);
		expect((await app.request('/v1/models')).status).toBe(404);
		expect(resolve).not.toHaveBeenCalled();
	});

	it('exposes per-exchange adapter diagnostics to lifecycle hooks', async () => {
		const seen: string[] = [];
		const app = createAiRouter({
			resolve: () => upstream,
			processors: [
				{
					name: 'observe',
					onRequest(request, ctx) {
						ctx.state.set('request', true);
						return request;
					},
					onError(error, ctx) {
						expect(ctx.state.get('request')).toBe(true);
						return error;
					},
				},
			],
			fetch: async () => new Response('{"error":{"message":"limited","type":"rate_limit_error"}}', { status: 429 }),
			onRequest(ctx) {
				seen.push(`request:${ctx.adapter?.context.phase}`);
			},
			onResponse(response, ctx) {
				seen.push(`response:${ctx.adapter?.context.phase}`);
				return response;
			},
		});
		expect((await app.fetch(post())).status).toBe(429);
		expect(seen).toEqual(['request:request', 'response:error']);
	});

	it('parses CRLF, multiline SSE data and UTF-8 bytes split inside a character', async () => {
		const wire = `: ping\r\nevent: ignored\r\ndata: ${JSON.stringify(chunk('你好🌍')).replace(',"choices"', ',\r\ndata: "choices"')}\r\n\r\ndata: [DONE]\r\n\r\n`;
		const bytes = new TextEncoder().encode(wire);
		let offset = 0;
		const app = createAiRouter({
			resolve: () => upstream,
			fetch: async () =>
				new Response(
					new ReadableStream({
						pull(controller) {
							if (offset === bytes.length) controller.close();
							else controller.enqueue(bytes.slice(offset, ++offset));
						},
					}),
					{ headers: { 'content-type': 'text/event-stream' } },
				),
		});
		const response = await app.fetch(post({ ...payload, stream: true }));
		const text = await response.text();
		expect(text).toContain('你好🌍');
		expect(text.match(/data: \[DONE\]/g)).toHaveLength(1);
	});

	it('emits an in-band failure instead of a successful terminator for malformed upstream SSE', async () => {
		const onError = vi.fn();
		const app = createAiRouter({
			resolve: () => upstream,
			fetch: async () => new Response('data: {invalid}\n\n', { headers: { 'content-type': 'text/event-stream' } }),
			onError,
		});
		const response = await app.fetch(post({ ...payload, stream: true }));
		const text = await response.text();
		expect(text).toContain('Upstream stream failed');
		expect(text).not.toContain('[DONE]');
		expect(onError).toHaveBeenCalledTimes(1);
	});

	it.each(['data: {"id":', 'data: {"error":{"message":"limited","type":"rate_limit_error"}}\n\n'])(
		'does not append successful completion to a truncated or failed SSE: %s',
		async (wire) => {
			const onError = vi.fn();
			const app = createAiRouter({
				resolve: () => upstream,
				fetch: async () => new Response(wire, { headers: { 'content-type': 'text/event-stream' } }),
				onError,
			});
			const response = await app.fetch(post({ ...payload, stream: true }));
			expect(await response.text()).not.toContain('[DONE]');
			expect(onError).toHaveBeenCalledTimes(1);
		},
	);

	it('aborts the upstream signal and releases its body when the consumer cancels', async () => {
		const cancel = vi.fn();
		let signal: AbortSignal | null | undefined;
		const app = createAiRouter({
			resolve: () => upstream,
			fetch: async (_input, init) => {
				signal = init?.signal;
				return new Response(
					new ReadableStream({
						start(controller) {
							controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk('hello'))}\n\n`));
						},
						cancel,
					}),
					{ headers: { 'content-type': 'text/event-stream' } },
				);
			},
		});
		const response = await app.fetch(post({ ...payload, stream: true }));
		const reader = response.body!.getReader();
		await reader.read();
		await reader.cancel();
		expect(signal?.aborted).toBe(true);
		expect(cancel).toHaveBeenCalledTimes(1);
	});
});
