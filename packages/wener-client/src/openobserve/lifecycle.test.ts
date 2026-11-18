import type { FetchLike } from '@wener/utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenObserveClient, type OpenObserveClientOptions } from './index';

function deferred<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
	return { promise, resolve, reject };
}
function client(fetch: FetchLike, options: Partial<OpenObserveClientOptions> = {}) {
	return new OpenObserveClient({ baseUrl: 'https://example.test/private', accessToken: 'SECRET', fetch, ...options });
}
function pendingBody(cancel = vi.fn(async (): Promise<void> => undefined)) {
	const readStarted = deferred<void>();
	const stream = new ReadableStream<Uint8Array>({
		pull() { readStarted.resolve(); return new Promise<void>(() => undefined); },
		cancel,
	});
	const getReader = stream.getReader.bind(stream);
	const releaseLock = vi.fn();
	vi.spyOn(stream, 'getReader').mockImplementation(() => {
		const reader = getReader();
		const release = reader.releaseLock.bind(reader);
		reader.releaseLock = () => { releaseLock(); release(); };
		return reader;
	});
	return { stream, cancel, readStarted, releaseLock };
}
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('OpenObserve request lifecycle', () => {
	it('rejects pre-aborted signals before fetching and never exposes their reason', async () => {
		const fetch = vi.fn(async () => Response.json({ list: [] }));
		const api = client(fetch);
		const controller = new AbortController();
		controller.abort(new Error('SECRET caller reason'));
		await expect(api.listStreams({}, { signal: controller.signal })).rejects.toMatchObject({ code: 'ABORTED', message: 'OpenObserve request was aborted' });
		await expect(api.status({}, { signal: controller.signal })).rejects.toMatchObject({ code: 'ABORTED' });
		expect(fetch).not.toHaveBeenCalled();
		await api.close();
	});

	it.each(['resolves', 'rejects', 'pending'] as const)('aborts a signal-ignoring fetch and handles late body cancellation that %s', async (cancellation) => {
		const delivered = deferred<Response>();
		const started = deferred<void>();
		let signal: AbortSignal | null | undefined;
		const api = client(async (_url, init) => { signal = init?.signal; started.resolve(); return delivered.promise; });
		const controller = new AbortController();
		const pending = api.listStreams({}, { signal: controller.signal });
		const assertion = expect(pending).rejects.toMatchObject({ code: 'ABORTED', message: 'OpenObserve request was aborted' });
		await started.promise;
		controller.abort('SECRET reason');
		await assertion;
		expect(signal?.aborted).toBe(true);
		const cancel = vi.fn(() => cancellation === 'rejects' ? Promise.reject(new Error('SECRET late cancellation'))
			: cancellation === 'pending' ? new Promise<void>(() => undefined) : Promise.resolve());
		const body = new ReadableStream({ cancel });
		delivered.resolve(new Response(body));
		await delivered.promise;
		await Promise.resolve();
		expect(cancel).toHaveBeenCalledOnce();
		await api.close();
		expect(body.locked).toBe(false);
		await new Promise<void>((resolve) => setTimeout(resolve, 0));
	});

	it.each(['abort', 'timeout', 'close'] as const)('cancels pending reader.read and releases its lock on %s', async (action) => {
		vi.useFakeTimers();
		const body = pendingBody();
		const api = client(async () => new Response(body.stream), { timeoutMs: 10 });
		const controller = new AbortController();
		const pending = api.listStreams({}, { signal: controller.signal });
		const code = action === 'abort' ? 'ABORTED' : action === 'timeout' ? 'TIMEOUT' : 'CLOSED';
		const assertion = expect(pending).rejects.toMatchObject({ code });
		await body.readStarted.promise;
		// Allow fetch resolution to install the reader before stopping the request.
		await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
		if (action === 'abort') controller.abort(new Error('SECRET'));
		else if (action === 'timeout') await vi.advanceTimersByTimeAsync(10);
		else await api.close();
		await assertion;
		expect(body.cancel).toHaveBeenCalledOnce();
		expect(body.cancel.mock.calls[0]).toEqual([undefined]);
		expect(body.releaseLock).toHaveBeenCalledOnce();
		expect(body.stream.locked).toBe(false);
		await api.close();
		expect(vi.getTimerCount()).toBe(0);
	});

	it.each(['rejects', 'pending', 'throws'] as const)('settles timeout/abort/close when body cancellation %s', async (cancellation) => {
		vi.useFakeTimers();
		for (const action of ['abort', 'timeout', 'close'] as const) {
			const body = pendingBody(vi.fn(() => {
				if (cancellation === 'throws') throw new Error('SECRET cancellation');
				return cancellation === 'rejects' ? Promise.reject(new Error('SECRET cancellation')) : new Promise<void>(() => undefined);
			}));
			const api = client(async () => new Response(body.stream), { timeoutMs: 10 });
			const controller = new AbortController();
			const pending = api.listStreams({}, { signal: controller.signal });
			const expected = action === 'abort'
				? { code: 'ABORTED', message: 'OpenObserve request was aborted' }
				: action === 'timeout' ? { code: 'TIMEOUT', message: 'OpenObserve request timed out' } : { code: 'CLOSED', message: 'OpenObserve client is closed' };
			const assertion = expect(pending).rejects.toMatchObject(expected);
			await body.readStarted.promise;
			await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
			if (action === 'abort') controller.abort(new Error('SECRET caller reason'));
			else if (action === 'timeout') await vi.advanceTimersByTimeAsync(10);
			else await api.close();
			await assertion;
			await api.close();
			expect(body.cancel).toHaveBeenCalledExactlyOnceWith(undefined);
			expect(body.releaseLock).toHaveBeenCalledOnce();
			expect(body.stream.locked).toBe(false);
			expect(vi.getTimerCount()).toBe(0);
		}
	});

	it('close immediately bars new calls and finishes all requests before cancellation settles', async () => {
		const cleanup = deferred<void>();
		const bodies = [pendingBody(vi.fn(() => cleanup.promise)), pendingBody(vi.fn(() => cleanup.promise))];
		let index = 0;
		const api = client(async () => new Response(bodies[index++]!.stream));
		const first = api.listStreams();
		const second = api.status();
		const assertions = [expect(first).rejects.toMatchObject({ code: 'CLOSED' }), expect(second).rejects.toMatchObject({ code: 'CLOSED' })];
		await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
		const closing = api.close();
		expect(api.close()).toBe(closing);
		await expect(api.listStreams()).rejects.toMatchObject({ code: 'CLOSED' });
		await expect(api.status()).rejects.toMatchObject({ code: 'CLOSED' });
		await closing;
		await Promise.all(assertions);
		for (const body of bodies) { expect(body.cancel).toHaveBeenCalledOnce(); expect(body.stream.locked).toBe(false); }
		// A late cancellation rejection must remain handled after close() has completed.
		cleanup.reject(new Error('SECRET late cancellation'));
		await new Promise<void>((resolve) => setTimeout(resolve, 0));
	});

	it('close settles promptly even when fetch ignores cancellation forever', async () => {
		const api = client(async () => new Promise<Response>(() => undefined));
		const pending = api.listStreams();
		const assertion = expect(pending).rejects.toMatchObject({ code: 'CLOSED' });
		await api.close();
		await assertion;
	});

	it('does not swallow caller cancellation during status', async () => {
		const body = pendingBody();
		const api = client(async () => new Response(body.stream));
		const controller = new AbortController();
		const pending = api.status({}, { signal: controller.signal });
		const assertion = expect(pending).rejects.toMatchObject({ code: 'ABORTED', message: 'OpenObserve request was aborted' });
		await body.readStarted.promise;
		controller.abort(new Error('SECRET'));
		await assertion;
		await api.close();
	});

	it('bounds actual body bytes incrementally, cancels at overflow, and never calls arrayBuffer', async () => {
		const cancel = vi.fn();
		let pulls = 0;
		const stream = new ReadableStream<Uint8Array>({ pull(controller) { pulls++; controller.enqueue(new Uint8Array(8)); }, cancel });
		const response = new Response(stream);
		const arrayBuffer = vi.spyOn(response, 'arrayBuffer');
		const api = client(async () => response, { maxResponseBytes: 10 });
		await expect(api.listStreams()).rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' });
		expect(pulls).toBeLessThanOrEqual(4);
		expect(cancel).toHaveBeenCalledOnce();
		expect(stream.locked).toBe(false);
		expect(arrayBuffer).not.toHaveBeenCalled();
		await api.close();
	});

	it('prechecks Content-Length and cancels without reading', async () => {
		const cancel = vi.fn();
		const stream = new ReadableStream<Uint8Array>({ cancel });
		const getReader = vi.spyOn(stream, 'getReader');
		const api = client(async () => new Response(stream, { headers: { 'content-length': '100' } }), { maxResponseBytes: 10 });
		await expect(api.listStreams()).rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' });
		expect(getReader).not.toHaveBeenCalled();
		expect(cancel).toHaveBeenCalledOnce();
		await api.close();
	});

	it.each(['rejects', 'pending'] as const)('does not await body cancellation that %s before acquiring a reader', async (cancellation) => {
		for (const failure of ['auth', 'size'] as const) {
			const cancel = vi.fn(() => cancellation === 'rejects' ? Promise.reject(new Error('SECRET cancellation')) : new Promise<void>(() => undefined));
			const body = new ReadableStream<Uint8Array>({ cancel });
			const getReader = vi.spyOn(body, 'getReader');
			const response = new Response(body, failure === 'auth' ? { status: 401 } : { headers: { 'content-length': '100' } });
			const api = client(async () => response, { maxResponseBytes: 10 });
			await expect(api.listStreams()).rejects.toMatchObject(failure === 'auth'
				? { code: 'AUTH_FAILED', message: 'OpenObserve list streams failed' }
				: { code: 'RESPONSE_TOO_LARGE', message: 'OpenObserve response is too large' });
			await api.close();
			expect(getReader).not.toHaveBeenCalled();
			expect(cancel).toHaveBeenCalledExactlyOnceWith(undefined);
			expect(body.locked).toBe(false);
		}
	});

	it('reads split UTF-8 and a response exactly at the byte limit', async () => {
		const bytes = new TextEncoder().encode(JSON.stringify({ list: [{ name: '中文', stream_type: 'logs' }] }));
		const stream = new ReadableStream<Uint8Array>({ start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); } });
		const api = client(async () => new Response(stream), { maxResponseBytes: bytes.length });
		await expect(api.listStreams()).resolves.toMatchObject({ streams: [{ name: '中文' }] });
		expect(stream.locked).toBe(false);
		await api.close();
	});

	it('cleans caller listeners and timers after success and failure', async () => {
		vi.useFakeTimers();
		const controller = new AbortController();
		const add = vi.spyOn(controller.signal, 'addEventListener');
		const remove = vi.spyOn(controller.signal, 'removeEventListener');
		const api = client(async () => Response.json({ list: [] }));
		await api.listStreams({}, { signal: controller.signal });
		expect(remove).toHaveBeenCalledWith('abort', add.mock.calls[0]![1]);
		expect(vi.getTimerCount()).toBe(0);
		await api.close();
	});

	it.each(['search', 'traces'] as const)('server and caller timeouts cannot extend configured HTTP deadline for %s', async (operation) => {
		vi.useFakeTimers();
		const calls: Array<{ url: string; init?: RequestInit }> = [];
		const api = client(async (url, init) => { calls.push({ url: String(url), init }); return new Promise<Response>(() => undefined); }, { timeoutMs: 1500 });
		const pending = operation === 'search'
			? api.search({ sql: 'SELECT 1', startTimeMicros: 0, endTimeMicros: 1, timeoutSeconds: 60 }, { timeoutMs: 10_000 })
			: api.listTraces({ stream: 'app', startTimeMicros: 0, endTimeMicros: 1, timeoutSeconds: 60 }, { timeoutMs: 10_000 });
		const assertion = expect(pending).rejects.toMatchObject({ code: 'TIMEOUT' });
		if (operation === 'search') expect(JSON.parse(String(calls[0]!.init?.body)).timeout).toBe(1);
		else expect(new URL(calls[0]!.url).searchParams.get('timeout')).toBe('1');
		await vi.advanceTimersByTimeAsync(1500);
		await assertion;
		await api.close();
		expect(vi.getTimerCount()).toBe(0);
	});

	it('honors caller abort after JSON parsing', async () => {
		const original = JSON.parse;
		const controller = new AbortController();
		const response = new Response('{"list":[]}');
		const api = client(async () => response);
		vi.spyOn(JSON, 'parse').mockImplementation((...args: Parameters<typeof JSON.parse>) => {
			const value = original(...args);
			controller.abort('SECRET');
			return value;
		});
		await expect(api.listStreams({}, { signal: controller.signal })).rejects.toMatchObject({ code: 'ABORTED' });
		await api.close();
	});

	it('checks elapsed timeout after synchronous JSON parsing', async () => {
		let now = 0;
		vi.spyOn(performance, 'now').mockImplementation(() => now);
		const original = JSON.parse;
		vi.spyOn(JSON, 'parse').mockImplementation((...args: Parameters<typeof JSON.parse>) => {
			const value = original(...args); now = 101; return value;
		});
		const api = client(async () => new Response('{"list":[]}'), { timeoutMs: 100 });
		await expect(api.listStreams()).rejects.toMatchObject({ code: 'TIMEOUT' });
		await api.close();
	});

	it('shortens the HTTP deadline for a request override', async () => {
		vi.useFakeTimers();
		const api = client(async () => new Promise<Response>(() => undefined), { timeoutMs: 1000 });
		const pending = api.listStreams({}, { timeoutMs: 5 });
		const assertion = expect(pending).rejects.toMatchObject({ code: 'TIMEOUT' });
		await vi.advanceTimersByTimeAsync(5);
		await assertion;
		await api.close();
	});

	it('releases the reader even if underlying body cancellation rejects with a secret', async () => {
		const body = new ReadableStream<Uint8Array>({
			start(controller) { controller.enqueue(new Uint8Array(20)); },
			cancel() { return Promise.reject(new Error('SECRET')); },
		});
		const api = client(async () => new Response(body), { maxResponseBytes: 10 });
		await expect(api.listStreams()).rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE', message: 'OpenObserve response is too large' });
		expect(body.locked).toBe(false);
		await api.close();
	});
});
