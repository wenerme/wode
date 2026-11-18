import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { type IModelService, MessageGenerationModelService, ModelService, type ModelStreamPart } from './index';

const input = { messages: [{ role: 'user', content: [{ type: 'text' as const, text: 'hello' }] }] };
const target = { api: 'openai' as const, baseUrl: 'https://example.test/v1' };
const encoder = new TextEncoder();
const chunk = (text: string) =>
	encoder.encode(
		`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: text }, finish_reason: null }] })}\n\n`,
	);

describe('public model content streams', () => {
	it('yields incremental text before completion and retains the final result', async () => {
		let source!: ReadableStreamDefaultController<Uint8Array>;
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				source = controller;
			},
		});
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValue(new Response(body, { headers: { 'content-type': 'text/event-stream' } }));
		const service: IModelService = new MessageGenerationModelService({ model: 'chat', target });
		const stream = service.streamContent(input, { fetch });
		expectTypeOf(stream).toEqualTypeOf<AsyncIterable<ModelStreamPart>>();
		expect(fetch).not.toHaveBeenCalled();
		const iterator = stream[Symbol.asyncIterator]();
		const first = iterator.next();
		source.enqueue(chunk('first'));
		expect(await first).toEqual({ done: false, value: { type: 'text-delta', delta: 'first' } });
		source.enqueue(chunk(' second'));
		expect((await iterator.next()).value).toEqual({ type: 'text-delta', delta: ' second' });
		source.enqueue(encoder.encode('data: [DONE]\n\n'));
		source.close();
		expect((await iterator.next()).value).toMatchObject({ type: 'finish', result: { text: 'first second' } });
		expect(await iterator.next()).toEqual({ done: true, value: undefined });
		expect(JSON.parse(String(fetch.mock.calls[0][1]?.body)).stream).toBe(true);
	});

	it('cancels the transport when the consumer stops early', async () => {
		const cancel = vi.fn();
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(chunk('first'));
			},
			cancel,
		});
		let signal: AbortSignal | undefined;
		const fetch: typeof globalThis.fetch = async (_url, options) => {
			signal = options?.signal ?? undefined;
			return new Response(body, { headers: { 'content-type': 'text/event-stream' } });
		};
		const service = new MessageGenerationModelService({ model: 'chat', target });
		for await (const part of service.streamContent(input, { fetch })) {
			expect(part.type).toBe('text-delta');
			break;
		}
		expect(signal?.aborted).toBe(true);
		expect(cancel).toHaveBeenCalledOnce();
	});

	it('rejects a pending read on abort and releases the upstream reader', async () => {
		const cancel = vi.fn();
		const body = new ReadableStream<Uint8Array>({ cancel });
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValue(new Response(body, { headers: { 'content-type': 'text/event-stream' } }));
		const controller = new AbortController();
		const service = new MessageGenerationModelService({ model: 'chat', target });
		const iterator = service.streamContent(input, { fetch, signal: controller.signal })[Symbol.asyncIterator]();
		const next = iterator.next();
		await vi.waitFor(() => expect(body.locked).toBe(true));
		controller.abort(new Error('stopped'));
		await expect(next).rejects.toThrow('stopped');
		expect(cancel).toHaveBeenCalledOnce();
		await vi.waitFor(() => expect(body.locked).toBe(false));
	});

	it('cancels a pending transport when the iterator is closed', async () => {
		const cancel = vi.fn();
		const body = new ReadableStream<Uint8Array>({ cancel });
		let signal: AbortSignal | undefined;
		const fetch: typeof globalThis.fetch = async (_url, options) => {
			signal = options?.signal ?? undefined;
			return new Response(body, { headers: { 'content-type': 'text/event-stream' } });
		};
		const service = new MessageGenerationModelService({ model: 'chat', target });
		const iterator = service.streamContent(input, { fetch })[Symbol.asyncIterator]();
		const next = iterator.next();
		await vi.waitFor(() => expect(body.locked).toBe(true));
		await iterator.return?.();
		await expect(next).resolves.toEqual({ done: true, value: undefined });
		await vi.waitFor(() => expect(signal?.aborted).toBe(true));
		await vi.waitFor(() => expect(cancel).toHaveBeenCalledOnce());
	});

	it('rejects already aborted requests before starting the handler', async () => {
		const generate = vi.fn();
		const controller = new AbortController();
		controller.abort(new Error('stopped'));
		const service = new MessageGenerationModelService({ model: 'chat', target, generate });
		await expect(async () => {
			for await (const _ of service.streamContent(input, { signal: controller.signal })) {
				/* consume */
			}
		}).rejects.toThrow('stopped');
		expect(generate).not.toHaveBeenCalled();
	});

	it('propagates stream failures and closes injected iterators on early return', async () => {
		const service = new MessageGenerationModelService({
			model: 'chat',
			target,
			generate: async () => {
				throw new Error('failed');
			},
		});
		await expect(async () => {
			for await (const _ of service.streamContent(input)) {
				/* consume */
			}
		}).rejects.toThrow('failed');
		const close = vi.fn();
		const injected = new ModelService({
			'message-streaming': async function* () {
				try {
					yield { type: 'text-delta', delta: 'hello' };
				} finally {
					close();
				}
			},
		});
		for await (const _ of injected.streamContent(input)) break;
		expect(close).toHaveBeenCalledOnce();
	});
});
