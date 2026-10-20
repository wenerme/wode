import { S3mini } from 's3mini';
import { describe, expect, test, vi } from 'vitest';
import { createS3MiniFileSystem } from './createS3MiniFileSystem';

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

function setup(respond: (init: RequestInit | undefined) => Promise<Response> | Response, requestAbortTimeout?: number) {
	const requested = deferred<RequestInit>();
	const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
		requested.resolve(init ?? {});
		return respond(init);
	});
	const createClient = (signal?: AbortSignal) =>
		new S3mini({
			endpoint: 'https://s3.example.test/bucket',
			accessKeyId: 'test',
			secretAccessKey: 'test',
			fetch: (input, init) => {
				signal?.throwIfAborted();
				return fetch(input, {
					...init,
					signal: signal && init?.signal ? AbortSignal.any([signal, init.signal]) : (signal ?? init?.signal),
				});
			},
			requestAbortTimeout,
			logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
		});
	const client = createClient();
	const fs = createS3MiniFileSystem({
		client,
		createReadClient: createClient,
		url: 'https://s3.example.test/bucket?pathStyle=true',
	});
	return { fs, client, fetch, requested: requested.promise };
}

function upstream() {
	let controller!: ReadableStreamDefaultController<Uint8Array>;
	const pulled = deferred<void>();
	const cancel = vi.fn();
	const pull = vi.fn(() => pulled.resolve());
	const body = new ReadableStream<Uint8Array>(
		{
			start(value) {
				controller = value;
			},
			pull,
			cancel,
		},
		{ highWaterMark: 0 },
	);
	return { body, controller, pull, cancel, pulled: pulled.promise };
}

describe('S3 Web readable streams', () => {
	test('reads only on demand without draining a ready upstream', async () => {
		let produced = 0;
		const body = new ReadableStream<Uint8Array>(
			{
				pull(controller) {
					controller.enqueue(new Uint8Array([++produced]));
				},
			},
			{ highWaterMark: 0 },
		);
		const { fs, fetch } = setup(() => new Response(body));
		const reader = fs.createReadableStream('/video.mp4').getReader();
		await tick();
		expect(fetch).not.toHaveBeenCalled();
		expect(produced).toBe(0);
		for (let value = 1; value <= 3; value++) {
			expect(await reader.read()).toEqual({ done: false, value: new Uint8Array([value]) });
			await tick();
			expect(produced).toBe(value);
		}
		expect(fetch).toHaveBeenCalledOnce();
		await reader.cancel();
		expect(body.locked).toBe(false);
	});

	test.each([
		[{ start: 7, end: 7 }, 'bytes=7-7'],
		[{ start: 2, end: 5 }, 'bytes=2-5'],
		[{ start: 9 }, 'bytes=9-'],
		[undefined, null],
	] as const)('sends one request with the inclusive range %j', async (range, expectedRange) => {
		const { fs, fetch } = setup(() => new Response(new Uint8Array([42]), { status: range ? 206 : 200 }));
		const reader = fs.createReadableStream('/audio.mp3', { range }).getReader();
		expect((await reader.read()).value).toEqual(new Uint8Array([42]));
		expect(await reader.read()).toEqual({ done: true, value: undefined });
		expect(fetch).toHaveBeenCalledOnce();
		const [input, init] = fetch.mock.calls[0]!;
		expect(new Headers(init?.headers).get('range')).toBe(expectedRange);
		expect(new URL(String(input)).searchParams.has('signal')).toBe(false);
	});

	test('cancels the SDK fetch while its response is pending', async () => {
		const { fs, requested } = setup(
			(init) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
				}),
		);
		const reader = fs.createReadableStream('/video.mp4').getReader();
		const reading = reader.read();
		const request = await requested;
		await reader.cancel('disconnected');
		expect(request.signal?.aborted).toBe(true);
		expect(request.signal?.reason).toBe('disconnected');
		expect(await reading).toEqual({ done: true, value: undefined });
	});

	test('cancels and releases a late body when fetch ignores cancellation', async () => {
		const response = deferred<Response>();
		const source = upstream();
		const { fs, requested } = setup(() => response.promise);
		const reader = fs.createReadableStream('/video.mp4').getReader();
		const reading = reader.read();
		const request = await requested;
		const cancelled = reader.cancel('disconnected');
		expect(request.signal?.aborted).toBe(true);
		response.resolve(new Response(source.body));
		await cancelled;
		expect(await reading).toEqual({ done: true, value: undefined });
		expect(source.pull).not.toHaveBeenCalled();
		expect(source.cancel).toHaveBeenCalledExactlyOnceWith('disconnected');
		expect(source.body.locked).toBe(false);
	});

	test('cancels a pending upstream read and handles a rejected cancellation', async () => {
		const source = upstream();
		source.cancel.mockRejectedValue(new Error('cancel failed'));
		const { fs, requested } = setup(() => new Response(source.body));
		const reader = fs.createReadableStream('/video.mp4').getReader();
		const reading = reader.read();
		await source.pulled;
		await reader.cancel('disconnected');
		expect((await requested).signal?.aborted).toBe(true);
		expect(await reading).toEqual({ done: true, value: undefined });
		expect(source.cancel).toHaveBeenCalledExactlyOnceWith('disconnected');
		expect(source.body.locked).toBe(false);
	});

	test('rejects an already aborted signal without requesting the object', async () => {
		const abort = new AbortController();
		const reason = new Error('already aborted');
		abort.abort(reason);
		const { fs, fetch } = setup(() => new Response());
		const reader = fs.createReadableStream('/video.mp4', { signal: abort.signal }).getReader();
		await expect(reader.read()).rejects.toBe(reason);
		expect(fetch).not.toHaveBeenCalled();
	});

	test('aborts a pending fetch and rejects the consumer immediately', async () => {
		const response = deferred<Response>();
		const source = upstream();
		const abort = new AbortController();
		const remove = vi.spyOn(abort.signal, 'removeEventListener');
		const { fs, requested } = setup(() => response.promise);
		const reader = fs.createReadableStream('/video.mp4', { signal: abort.signal }).getReader();
		const reason = new Error('aborted during fetch');
		const reading = expect(reader.read()).rejects.toBe(reason);
		const request = await requested;
		abort.abort(reason);
		await reading;
		expect(request.signal?.aborted).toBe(true);
		response.resolve(new Response(source.body));
		await tick();
		expect(source.cancel).toHaveBeenCalledExactlyOnceWith(reason);
		expect(source.pull).not.toHaveBeenCalled();
		expect(source.body.locked).toBe(false);
		expect(remove).toHaveBeenCalledOnce();
	});

	test('aborts an active reader and consumes rejected cancellation', async () => {
		const source = upstream();
		source.cancel.mockRejectedValue(new Error('cancel failed'));
		const abort = new AbortController();
		const remove = vi.spyOn(abort.signal, 'removeEventListener');
		const { fs } = setup(() => new Response(source.body));
		const reader = fs.createReadableStream('/video.mp4', { signal: abort.signal }).getReader();
		const reason = new Error('aborted during read');
		const reading = expect(reader.read()).rejects.toBe(reason);
		await source.pulled;
		abort.abort(reason);
		await reading;
		await tick();
		expect(source.cancel).toHaveBeenCalledExactlyOnceWith(reason);
		expect(source.body.locked).toBe(false);
		expect(remove).toHaveBeenCalledOnce();
	});

	test('releases the reader and removes the abort listener at EOF', async () => {
		const source = upstream();
		const abort = new AbortController();
		const remove = vi.spyOn(abort.signal, 'removeEventListener');
		const { fs } = setup(() => new Response(source.body));
		const reader = fs.createReadableStream('/video.mp4', { signal: abort.signal }).getReader();
		const reading = reader.read();
		await source.pulled;
		source.controller.close();
		expect(await reading).toEqual({ done: true, value: undefined });
		expect(source.body.locked).toBe(false);
		expect(remove).toHaveBeenCalledOnce();
		abort.abort();
		expect(await reader.read()).toEqual({ done: true, value: undefined });
		expect(source.cancel).not.toHaveBeenCalled();
	});

	test('releases resources after upstream failure and preserves the error', async () => {
		const source = upstream();
		const abort = new AbortController();
		const remove = vi.spyOn(abort.signal, 'removeEventListener');
		const { fs } = setup(() => new Response(source.body));
		const reader = fs.createReadableStream('/video.mp4', { signal: abort.signal }).getReader();
		const failure = new Error('upstream failed');
		const reading = expect(reader.read()).rejects.toBe(failure);
		await source.pulled;
		source.controller.error(failure);
		await reading;
		await tick();
		expect(source.body.locked).toBe(false);
		expect(remove).toHaveBeenCalledOnce();
		abort.abort();
		await expect(reader.read()).rejects.toBe(failure);
	});

	test('cancels before the first read without starting a request', async () => {
		const abort = new AbortController();
		const remove = vi.spyOn(abort.signal, 'removeEventListener');
		const { fs, fetch } = setup(() => new Response());
		const stream = fs.createReadableStream('/video.mp4', { signal: abort.signal });
		await stream.cancel('unused');
		abort.abort();
		expect(fetch).not.toHaveBeenCalled();
		expect(remove).toHaveBeenCalledOnce();
	});

	test('preserves the SDK request timeout signal', async () => {
		const { fs, requested } = setup(
			(init) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
				}),
			10,
		);
		await expect(fs.createReadableStream('/video.mp4').getReader().read()).rejects.toThrow();
		expect((await requested).signal?.aborted).toBe(true);
	});

	test('reports fetch and SDK HTTP failures', async () => {
		for (const respond of [
			() => {
				throw new Error('connection failed');
			},
			() => new Response('<Error><Code>ServiceUnavailable</Code></Error>', { status: 503 }),
		]) {
			const { fs } = setup(respond);
			await expect(fs.createReadableStream('/video.mp4').getReader().read()).rejects.toThrow();
		}
	});

	test('reports missing response bodies', async () => {
		const { fs } = setup(() => new Response(null));
		await expect(fs.createReadableStream('/video.mp4').getReader().read()).rejects.toThrow('No response body');
	});

	test('reports an SDK response with an error status and cancels its body', async () => {
		const source = upstream();
		const { client, fetch } = setup(() => {
			throw new Error('unexpected fetch');
		});
		vi.spyOn(client, 'getObjectRaw').mockResolvedValue(new Response(source.body, { status: 500 }));
		const fs = createS3MiniFileSystem({
			client,
			createReadClient: () => client,
			url: 'https://s3.example.test/bucket?pathStyle=true',
		});
		await expect(fs.createReadableStream('/video.mp4').getReader().read()).rejects.toThrow('HTTP 500');
		await tick();
		expect(source.cancel).toHaveBeenCalledOnce();
		expect(source.body.locked).toBe(false);
		expect(fetch).not.toHaveBeenCalled();
	});

	test('keeps concurrent requests cancellation isolated', async () => {
		const sources = [upstream(), upstream()];
		let index = 0;
		const { fs, fetch } = setup(() => new Response(sources[index++]!.body));
		const first = fs.createReadableStream('/first.mp4').getReader();
		const firstReading = first.read();
		await sources[0]!.pulled;
		const second = fs.createReadableStream('/second.mp4').getReader();
		const secondReading = second.read();
		await sources[1]!.pulled;
		await first.cancel('first only');
		expect(await firstReading).toEqual({ done: true, value: undefined });
		expect(fetch.mock.calls[0]![1]?.signal?.aborted).toBe(true);
		expect(fetch.mock.calls[1]![1]?.signal?.aborted).toBe(false);
		sources[1]!.controller.enqueue(new Uint8Array([5]));
		expect((await secondReading).value).toEqual(new Uint8Array([5]));
		await second.cancel();
	});
});
