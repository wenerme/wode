import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { OpenObserveClient, type OpenObserveClientOptions, type OpenObserveSearchInput } from './index';

const window = { startTimeMicros: 1, endTimeMicros: 2 };
const search = { sql: 'SELECT * FROM app', ...window };
function fixture(fetch: FetchLike, options: Partial<OpenObserveClientOptions> = {}) {
	return new OpenObserveClient({ baseUrl: 'https://observe.example.test/proxy/observe/', accessToken: 'TOKEN', fetch, ...options });
}

describe('OpenObserve offline protocol', () => {
	it('implements all five endpoints, preserves the base path and projects real API fields', async () => {
		const calls: Array<{ url: URL; init?: RequestInit }> = [];
		const fetch: FetchLike = async (input, init) => {
			const url = new URL(String(input));
			calls.push({ url, init });
			expect(new Headers(init?.headers).get('authorization')).toBe('Bearer TOKEN');
			expect(new Headers(init?.headers).get('accept')).toBe('application/json');
			expect(new Headers(init?.headers).get('x-custom')).toBe('test');
			if (url.pathname.endsWith('/healthz')) return Response.json({ status: 'ok', secret: 'IGNORED' });
			if (url.pathname.endsWith('/streams')) return Response.json({ list: [{ name: 'app', stream_type: 'logs', stats: { doc_num: 3, storage_size: 20 }, schema: [{ name: 'message', type: 'Utf8' }] }], total: 4 });
			if (url.pathname.endsWith('/schema')) return Response.json({ schema: [{ name: 'message', type: 'Utf8' }], total_fields: 3, stream_type: 'logs' });
			return Response.json({ hits: [{ message: 'ok' }], total: 9, took: 3, scan_size: 40, is_partial: false, trace_id: 'trace-id', secret: 'IGNORED' });
		};
		const client = fixture(fetch, { organization: 'acme /?#', headers: { 'X-Custom': 'test' } });
		expect(client.type).toBe('openobserve');
		expect(client.readOnly).toBe(true);
		await expect(client.status()).resolves.toMatchObject({ reachable: true, readOnly: true, streamType: 'logs', authConfigured: true, endpointCount: 2 });
		await expect(client.listStreams({ offset: 2, limit: 5, fetchSchema: true, keyword: 'api & db' })).resolves.toEqual({ streams: [{ organization: 'acme /?#', name: 'app', streamType: 'logs', documentCount: 3, storageBytes: 20 * 1024 * 1024, schemaFields: ['message'] }], total: 4 });
		await expect(client.getStreamSchema({ stream: 'app /?#', offset: 1, limit: 2, keyword: 'mess' })).resolves.toEqual({ organization: 'acme /?#', stream: 'app /?#', streamType: 'logs', fields: [{ name: 'message', type: 'Utf8' }], totalFields: 3 });
		await expect(client.search({ ...search, streamType: 'metrics', from: 2, size: 5, timeoutSeconds: 10 })).resolves.toMatchObject({ streamType: 'metrics', hits: [{ message: 'ok' }], total: 9, from: 2, size: 5, tookMs: 3, scanBytes: 40 * 1024 * 1024, isPartial: false, functionErrors: [] });
		await expect(client.listTraces({ ...window, stream: 'trace /?#', from: 2, size: 5, filter: 'service=api & x', timeoutSeconds: 12, sortBy: 'duration', sortOrder: 'asc' })).resolves.toEqual({ streamType: 'traces', traces: [{ message: 'ok' }], total: 9, from: 2, size: 5, tookMs: 3, isPartial: false, functionErrors: [], traceId: 'trace-id' });
		expect(calls.map(({ url }) => url.pathname)).toEqual([
			'/proxy/observe/healthz', '/proxy/observe/api/acme%20%2F%3F%23/streams', '/proxy/observe/api/acme%20%2F%3F%23/streams',
			'/proxy/observe/api/acme%20%2F%3F%23/streams/app%20%2F%3F%23/schema', '/proxy/observe/api/acme%20%2F%3F%23/_search', '/proxy/observe/api/acme%20%2F%3F%23/trace%20%2F%3F%23/traces/latest',
		]);
		expect(Object.fromEntries(calls[1]!.url.searchParams)).toEqual({ type: 'logs', offset: '0', limit: '1', fetchSchema: 'false' });
		expect(Object.fromEntries(calls[2]!.url.searchParams)).toEqual({ type: 'logs', offset: '2', limit: '5', fetchSchema: 'true', keyword: 'api & db' });
		expect(Object.fromEntries(calls[3]!.url.searchParams)).toEqual({ type: 'logs', offset: '1', limit: '2', keyword: 'mess' });
		expect(calls[4]!.url.search).toBe('?type=metrics');
		expect(calls[4]!.init?.method).toBe('POST');
		expect(new Headers(calls[4]!.init?.headers).get('content-type')).toBe('application/json');
		expect(JSON.parse(String(calls[4]!.init?.body))).toEqual({ query: { sql: search.sql, start_time: 1, end_time: 2, from: 2, size: 5 }, timeout: 10 });
		expect(Object.fromEntries(calls[5]!.url.searchParams)).toEqual({ type: 'traces', start_time: '1', end_time: '2', from: '2', size: '5', timeout: '12', filter: 'service=api & x', sort_by: 'duration', sort_order: 'asc' });
		for (const index of [0, 1, 2, 3, 5]) { expect(calls[index]!.init?.method).toBe('GET'); expect(calls[index]!.init?.body).toBeUndefined(); }
		await client.close();
	});

	it.each([
		{ fields: {}, expected: undefined },
		{ fields: { scan_size: 2 }, expected: 2 * 1024 * 1024 },
		{ fields: { scan_size: 0.1 }, expected: 104858 },
		{ fields: { scan_size: 0.5 / (1024 * 1024) }, expected: 1 },
		{ fields: { scan_size: Number.MAX_SAFE_INTEGER / (1024 * 1024) }, expected: Number.MAX_SAFE_INTEGER },
		{ fields: { scan_bytes: 17 }, expected: 17 },
		{ fields: { scan_bytes: 17, scan_size: 2 }, expected: 17 },
		{ fields: { scan_bytes: 0, scan_size: 'ignored' }, expected: 0 },
		{ fields: { scan_bytes: null, scan_size: 0.5 }, expected: 512 * 1024 },
	])('normalizes scan sizes consistently for search, values and around: %#', async ({ fields, expected }) => {
		const client = fixture(async () => Response.json({ hits: [], ...fields }));
		for (const result of [
			await client.search(search),
			await client.getValues({ stream: 'app', fields: ['message'], ...window }),
			await client.searchAround({ stream: 'app', key: 1 }),
		]) expect(result.scanBytes).toBe(expected);
		await client.close();
	});

	it.each([
		{ scan_size: Number.MAX_VALUE }, { scan_size: 2 ** 33 }, { scan_size: -1 }, { scan_size: '1' },
		{ scan_bytes: -1, scan_size: 1 }, { scan_bytes: '1', scan_size: 1 },
	])('rejects invalid or overflowing scan sizes across query endpoints: %#', async (fields) => {
		const client = fixture(async () => Response.json({ hits: [], ...fields }));
		await expect(client.search(search)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await expect(client.getValues({ stream: 'app', fields: ['message'], ...window })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await expect(client.searchAround({ stream: 'app', key: 1 })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await client.close();
	});

	it.each([
		{ fields: {}, expected: undefined },
		{ fields: { stats: { storage_size: 1.5 } }, expected: 1.5 * 1024 * 1024 },
		{ fields: { storage_size: 0.1 }, expected: 104858 },
		{ fields: { stats: { storage_size: 0 }, storage_size: 2 }, expected: 0 },
		{ fields: { stats: { storage_bytes: 17 } }, expected: 17 },
		{ fields: { storage_bytes: 17 }, expected: 17 },
		{ fields: { stats: { storage_bytes: 23, storage_size: 1 }, storage_bytes: 17 }, expected: 23 },
		{ fields: { stats: { storage_size: 2 }, storage_bytes: 17 }, expected: 17 },
		{ fields: { stats: { storage_bytes: 0 }, storage_size: 'ignored' }, expected: 0 },
		{ fields: { stats: { storage_bytes: null, storage_size: 0.5 } }, expected: 512 * 1024 },
	])('normalizes stream storage with explicit bytes preferred over MiB: %#', async ({ fields, expected }) => {
		const client = fixture(async () => Response.json({ list: [{ name: 'app', stream_type: 'logs', ...fields }] }));
		expect((await client.listStreams()).streams[0]!.storageBytes).toBe(expected);
		await client.close();
	});

	it.each([
		{ stats: { storage_size: Number.MAX_VALUE } }, { storage_size: 2 ** 33 }, { stats: { storage_size: -1 } },
		{ storage_size: '1' }, { stats: { storage_bytes: -1 }, storage_size: 1 }, { storage_bytes: '1', storage_size: 1 },
	])('rejects invalid or overflowing stream storage sizes: %#', async (fields) => {
		const client = fixture(async () => Response.json({ list: [{ name: 'app', stream_type: 'logs', ...fields }] }));
		await expect(client.listStreams()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await client.close();
	});

	it('defaults organization and UTF-8 encodes Basic auth without Buffer', async () => {
		const fetch = vi.fn(async (_url: Parameters<FetchLike>[0], init?: RequestInit) => {
			const auth = new Headers(init?.headers).get('authorization')!;
			const decoded = Uint8Array.from(atob(auth.slice(6)), (char) => char.charCodeAt(0));
			expect(new TextDecoder().decode(decoded)).toBe('用户:密碼🔑');
			return Response.json({ list: [] });
		});
		const client = new OpenObserveClient({ baseUrl: 'https://example.test', username: '用户', password: '密碼🔑', fetch });
		await client.listStreams();
		expect(String(fetch.mock.calls[0]![0])).toBe('https://example.test/api/default/streams?type=logs&offset=0&limit=100');
		await client.close();
	});

	it('accepts a single explicit Authorization header', async () => {
		const fetch: FetchLike = async (_url, init) => {
			expect(new Headers(init?.headers).get('authorization')).toBe('Bearer CUSTOM');
			return Response.json({ list: [] });
		};
		const client = fixture(fetch, { accessToken: undefined, headers: { Authorization: 'Bearer CUSTOM' } });
		await client.listStreams();
		await client.close();
	});

	it.each([
		{}, { accessToken: '' }, { accessToken: null }, { username: 'user' }, { password: 'pass' },
		{ username: 'u:ser', password: 'pass' }, { accessToken: 'TOKEN', username: 'user', password: 'pass' },
		{ accessToken: 'TOKEN', headers: { Authorization: 'Bearer OTHER' } },
		{ username: 'user', password: 'pass', headers: { authorization: 'Basic OTHER' } },
		{ headers: { Authorization: '' } }, { headers: { Authorization: 'Bearer A', authorization: 'Bearer B' } },
		{ accessToken: 'a\r\nb' }, { username: 'a\n', password: 'b' }, { accessToken: 'TOKEN', headers: { 'x-test': 'a\r\nb' } },
		{ accessToken: 'TOKEN', headers: { 'bad header': 'x' } },
		{ accessToken: 'TOKEN', baseUrl: 'https://u:p@example.test' }, { accessToken: 'TOKEN', baseUrl: 'https://example.test/?q=secret' },
		{ accessToken: 'TOKEN', baseUrl: 'https://example.test/#secret' }, { accessToken: 'TOKEN', baseUrl: 'file:///secret' },
		{ accessToken: 'TOKEN', baseUrl: 'https://example.test/?' }, { accessToken: 'TOKEN', baseUrl: 'https://example.test/#' },
		{ accessToken: 'TOKEN', timeoutMs: 0 }, { accessToken: 'TOKEN', maxResponseBytes: 0 },
		{ accessToken: 'TOKEN', organization: '..' }, { accessToken: 'TOKEN', organization: '' },
	])('rejects invalid configuration safely: %#', (config) => {
		expect(() => new OpenObserveClient({ baseUrl: 'https://example.test', ...config } as OpenObserveClientOptions)).toThrow(expect.objectContaining({ code: 'INVALID_CONFIG', message: 'Invalid OpenObserve configuration' }));
	});

	it.each([
		{ startTimeMicros: undefined }, { endTimeMicros: undefined }, { startTimeMicros: null }, { startTimeMicros: -1 },
		{ startTimeMicros: 1.5 }, { endTimeMicros: Number.MAX_SAFE_INTEGER + 1 }, { endTimeMicros: Infinity },
		{ endTimeMicros: 1 }, { endTimeMicros: 86_400_000_002 }, { from: 2_147_483_647 }, { from: -1 },
		{ size: 0 }, { size: 1001 }, { size: NaN }, { timeoutSeconds: 61 }, { timeoutSeconds: 0 },
		{ streamType: 'unknown' }, { streamType: null }, { organization: '..' }, { organization: '.' },
		{ sql: 'DELETE FROM secret' }, { sql: '' }, { sql: 'SELECT 1; SELECT 2' }, { sql: `SELECT '${'字'.repeat(22_000)}'` },
	])('rejects malformed search before network: %#', async (patch) => {
		const fetch = vi.fn(async () => Response.json({ hits: [] }));
		const client = fixture(fetch);
		await expect(client.search({ ...search, ...patch } as OpenObserveSearchInput)).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect(fetch).not.toHaveBeenCalled();
		await client.close();
	});

	it('validates every list/schema/trace filter, sort, paging and path before fetch', async () => {
		const fetch = vi.fn(async () => Response.json({}));
		const client = fixture(fetch);
		const invalid: Array<() => Promise<unknown>> = [
			() => client.listStreams({ keyword: 2 } as never), () => client.listStreams({ keyword: 'x\n' }),
			() => client.listStreams({ keyword: 'x'.repeat(257) }), () => client.listStreams({ fetchSchema: 'true' } as never),
			() => client.listStreams({ offset: 2_147_483_646, limit: 2 }), () => client.listStreams({ limit: null } as never),
			() => client.getStreamSchema({ stream: '.' }), () => client.getStreamSchema({ stream: '..' }),
			() => client.getStreamSchema({ stream: 'app', keyword: false } as never), () => client.getStreamSchema({ stream: '' }),
			() => client.listTraces({ ...window, stream: '..' }), () => client.listTraces({ ...window, stream: 'app', filter: 2 } as never),
			() => client.listTraces({ ...window, stream: 'app', filter: 'x'.repeat(8193) }),
			() => client.listTraces({ ...window, stream: 'app', sortBy: 'secret' } as never),
			() => client.listTraces({ ...window, stream: 'app', sortOrder: 'secret' } as never),
			() => client.listTraces({ stream: 'app' } as never), () => client.search(null as never),
			() => client.status({ streamType: 'bad' } as never), () => client.status({ organization: '..' }),
			() => client.listStreams({}, { timeoutMs: 0 }),
		];
		for (const call of invalid) await expect(call()).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect(fetch).not.toHaveBeenCalled();
		await client.close();
	});

	it('double encodes percent signs so encoded dot or slash names remain one path segment', async () => {
		const fetch = vi.fn(async (_url: Parameters<FetchLike>[0], _init?: RequestInit) => Response.json({ schema: [] }));
		const client = fixture(fetch);
		await client.getStreamSchema({ organization: '%2e%2e', stream: '%2e%2e/child' });
		expect(String(fetch.mock.calls[0]![0])).toContain('/api/%252e%252e/streams/%252e%252e%2Fchild/schema');
		await client.close();
	});

	it.each(['SECRET sql token', ['SECRET sql token', 'SECOND']])('redacts partial function errors: %#', async (function_error) => {
		const client = fixture(async () => Response.json({ hits: [], function_error, is_partial: true }));
		for (const result of [await client.search(search), await client.listTraces({ ...window, stream: 'app' })]) {
			expect(result.isPartial).toBe(true);
			expect(result.functionErrors).toEqual(['OpenObserve reported a partial query error']);
			expect(JSON.stringify(result)).not.toContain('SECRET');
		}
		await client.close();
	});

	it('does not silently report success when function_error exists without is_partial', async () => {
		const client = fixture(async () => Response.json({ hits: [], function_error: 'SECRET' }));
		expect((await client.search(search)).isPartial).toBe(true);
		await client.close();
	});

	it.each([null, true, 1, 'SECRET', [], {}, { hits: {} }, { hits: [], total: '1' }, { hits: [], from: 2 }, { hits: [], size: 101 }, { hits: [], took: -1 }, { hits: [], scan_size: 'SECRET' }, { hits: [], function_error: [1] }, { hits: [], function_error: {} }, { hits: [], is_partial: 'true' }, { hits: [], trace_id: 2 }])('rejects invalid query response shapes: %#', async (value) => {
		const client = fixture(async () => Response.json(value));
		await expect(client.search(search)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await expect(client.listTraces({ ...window, stream: 'app' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await client.close();
	});

	it.each([{}, [], { list: null }, { list: [{}] }, { list: [{ name: 'app', stream_type: 'logs', stats: { doc_num: '1' } }] }, { list: [{ name: 'app', stream_type: 'logs', schema: [{}] }] }, { list: [], total: -1 }])('rejects invalid stream list shapes: %#', async (value) => {
		const client = fixture(async () => Response.json(value));
		await expect(client.listStreams()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await client.close();
	});

	it.each([{}, [], { schema: null }, { schema: [{}] }, { schema: [{ name: 'message' }] }, { schema: [], total_fields: 1.5 }])('rejects invalid schema shapes: %#', async (value) => {
		const client = fixture(async () => Response.json(value));
		await expect(client.getStreamSchema({ stream: 'app' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await client.close();
	});

	it.each([{}, { status: 'error' }, [], null])('validates health status and returns a fixed safe status error: %#', async (value) => {
		const fetch = vi.fn(async () => Response.json(value));
		const client = fixture(fetch);
		await expect(client.status()).resolves.toMatchObject({ reachable: false, error: { code: 'INVALID_RESPONSE', message: 'OpenObserve status check failed' } });
		expect(fetch).toHaveBeenCalledTimes(1);
		await client.close();
	});

	it.each([401, 403, 500])('returns safe HTTP errors without response bodies: %i', async (status) => {
		const cancel = vi.fn();
		const client = fixture(async () => new Response(new ReadableStream({ cancel }), { status }));
		await expect(client.search(search)).rejects.toMatchObject({ code: status === 500 ? 'REQUEST_FAILED' : 'AUTH_FAILED', status, message: 'OpenObserve search failed' });
		expect(cancel).toHaveBeenCalledOnce();
		await client.close();
	});

	it('redacts transport/body/JSON errors and ignores unknown response fields', async () => {
		for (const fetch of [
			async () => { throw new Error('https://secret/?token=SECRET Bearer SECRET'); },
			async () => new Response(new ReadableStream({ start(controller) { controller.error(new Error('SECRET')); } })),
			async () => new Response('SECRET invalid json'),
		]) {
			const client = fixture(fetch);
			await expect(client.listStreams()).rejects.not.toThrow('SECRET');
			await expect(client.status()).resolves.toMatchObject({ reachable: false, error: { message: 'OpenObserve status check failed' } });
			await client.close();
		}
		const client = fixture(async () => Response.json({ hits: [], extra: { token: 'SECRET' } }));
		expect(JSON.stringify(await client.search(search))).not.toContain('SECRET');
		await client.close();
	});
});
