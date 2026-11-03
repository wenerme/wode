import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { OpenObserveClient, validateOpenObserveStreamSettingsUpdate, type OpenObserveJsonObject, type OpenObserveStreamPartition, type OpenObserveUpdateStreamSettings } from './index';

function fixture(fetch: FetchLike) {
	return new OpenObserveClient({ baseUrl: 'https://example.test/observe/', accessToken: 'TOKEN', fetch });
}
const stream = { organization: 'org /', stream: 'app /' };
describe('OpenObserve documented stream/ingestion protocols', () => {
	it('exports a pure settings validator and returns parsed settings without changing the input', () => {
		const input = Object.freeze({ partition_keys: Object.freeze({ add: Object.freeze([Object.freeze({ field: 'id', types: Object.freeze({ hash: 16 }) })]) }), data_retention: 3 });
		const output: OpenObserveUpdateStreamSettings = validateOpenObserveStreamSettingsUpdate(input);
		expect(output).toEqual(input);
		expect(output).not.toBe(input);
		expect(output.partition_keys?.add?.[0]).not.toBe(input.partition_keys.add[0]);
	});

	it.each([null, [], {}, { data_retention: 1 }, { unknown: true }, { index_fields: { set: ['message'] } }, { partition_keys: { add: ['cluster'] } }])('pure settings validation rejects invalid settings safely: %#', (value) => {
		expect(() => validateOpenObserveStreamSettingsUpdate(value)).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST', message: 'Invalid OpenObserve request' }));
	});

	it('health performs only the health request and projects status', async () => {
		const fetch = vi.fn(async (_url: Parameters<FetchLike>[0], init?: RequestInit) => {
			expect(init?.method).toBe('GET');
			return Response.json({ status: 'ok', extra: 'SECRET' });
		});
		const api = fixture(fetch);
		await expect(api.health()).resolves.toEqual({ status: 'ok' });
		expect(String(fetch.mock.calls[0]![0])).toBe('https://example.test/observe/healthz');
		expect(fetch).toHaveBeenCalledOnce();
		await api.close();
	});

	it('gets settings from schema, updates with PUT wrappers, and deletes with DELETE flags', async () => {
		const calls: Array<{ url: URL; init?: RequestInit }> = [];
		const settings = { partition_keys: {}, full_text_search_keys: ['message'], data_retention: 30, store_original_data: true };
		const api = fixture(async (input, init) => {
			const url = new URL(String(input)); calls.push({ url, init });
			expect(new Headers(init?.headers).get('authorization')).toBe('Bearer TOKEN');
			return Response.json(init?.method === 'GET' ? { settings: { ...settings, unknown: 'SECRET' } } : { code: 200, message: 'SECRET server message' });
		});
		await expect(api.getStreamSettings({ ...stream, streamType: 'metrics' })).resolves.toEqual({ ...stream, streamType: 'metrics', settings });
		const partitions: OpenObserveStreamPartition[] = [{ field: 'cluster' }, { field: 'service', types: 'value', disabled: false }, { field: 'host', types: 'prefix' }, { field: 'id', types: { hash: 32 }, disabled: true }];
		const update: OpenObserveUpdateStreamSettings = { partition_keys: { add: partitions, remove: [{ field: 'old' }] }, full_text_search_keys: { add: ['message'], remove: ['old'] }, data_retention: 30, extended_retention_days: { add: [] }, index_all_values: true };
		await expect(api.updateStreamSettings({ ...stream, settings: update })).resolves.toEqual({ code: 200, message: 'OpenObserve operation accepted' });
		await api.deleteStream({ ...stream, streamType: 'traces', deleteAll: true });
		expect(calls.map(({ url, init }) => [init?.method, url.pathname, Object.fromEntries(url.searchParams)])).toEqual([
			['GET', '/observe/api/org%20%2F/streams/app%20%2F/schema', { type: 'metrics' }],
			['PUT', '/observe/api/org%20%2F/streams/app%20%2F/settings', { type: 'logs' }],
			['DELETE', '/observe/api/org%20%2F/streams/app%20%2F', { type: 'traces', delete_all: 'true' }],
		]);
		expect(new Headers(calls[1]!.init?.headers).get('content-type')).toBe('application/json');
		expect(JSON.parse(String(calls[1]!.init?.body))).toEqual(update);
		expect(calls[2]!.init?.body).toBeUndefined();
		await api.close();
	});

	it('ingests JSON arrays and NDJSON records with correct methods, paths and content types', async () => {
		const calls: Array<{ url: string; init?: RequestInit }> = [];
		const records: OpenObserveJsonObject[] = [{ message: '中文\nline', nested: { number: 1 } }, { message: 'second', valid: true }];
		const api = fixture(async (url, init) => { calls.push({ url: String(url), init }); return Response.json({ code: 200, status: [{ name: stream.stream, successful: 1, failed: 1, error: 'SECRET raw error' }] }); });
		for (const result of [await api.ingestJson({ ...stream, records }), await api.ingestMulti({ ...stream, records }), await api.ingestMulti({ ...stream, records: '{"message":"one"}\n{"message":"two"}' })]) {
			expect(result).toEqual({ code: 200, status: [{ name: stream.stream, successful: 1, failed: 1, error: 'OpenObserve reported failed ingestion records' }] });
		}
		expect(calls[0]!.url).toBe('https://example.test/observe/api/org%20%2F/app%20%2F/_json');
		expect(calls[1]!.url).toBe('https://example.test/observe/api/org%20%2F/app%20%2F/_multi');
		for (const call of calls) expect(call.init?.method).toBe('POST');
		expect(new Headers(calls[0]!.init?.headers).get('content-type')).toBe('application/json');
		expect(new Headers(calls[1]!.init?.headers).get('content-type')).toBe('application/x-ndjson');
		expect(JSON.parse(String(calls[0]!.init?.body))).toEqual(records);
		expect(calls[1]!.init?.body).toBe(records.map((record) => JSON.stringify(record)).join('\n') + '\n');
		expect(calls[2]!.init?.body).toBe('{"message":"one"}\n{"message":"two"}\n');
		await api.close();
	});

	it('implements values and around using their documented GET query parameters', async () => {
		const calls: Array<{ url: URL; init?: RequestInit }> = [];
		const api = fixture(async (input, init) => {
			const url = new URL(String(input)); calls.push({ url, init });
			return Response.json(url.pathname.endsWith('/_values')
				? { hits: [{ field: 'service', values: [{ zo_sql_key: 'api', zo_sql_num: 5 }] }], total: 1, took: 2, scan_size: 4, size: 0 }
				: { hits: [{ _timestamp: 10 }], total: 1, took: 2, from: 0, size: 0, scan_size: 4 });
		});
		await expect(api.getValues({ ...stream, fields: ['service'], startTimeMicros: 1, endTimeMicros: 20, size: 5, keyword: 'a & b', noCount: false })).resolves.toEqual({ hits: [{ field: 'service', values: [{ zo_sql_key: 'api', zo_sql_num: 5 }] }], total: 1, tookMs: 2, scanBytes: 4 * 1024 * 1024 });
		await expect(api.searchAround({ ...stream, key: 10, size: 5 })).resolves.toMatchObject({ hits: [{ _timestamp: 10 }], from: 0, size: 5, total: 1, scanBytes: 4 * 1024 * 1024 });
		expect(calls[0]!.url.pathname).toBe('/observe/api/org%20%2F/app%20%2F/_values');
		expect(Object.fromEntries(calls[0]!.url.searchParams)).toEqual({ type: 'logs', fields: 'service', start_time: '1', end_time: '20', size: '5', keyword: 'a & b', no_count: 'false' });
		expect(calls[1]!.url.pathname).toBe('/observe/api/org%20%2F/app%20%2F/_around');
		expect(Object.fromEntries(calls[1]!.url.searchParams)).toEqual({ type: 'logs', key: '10', size: '5' });
		for (const call of calls) { expect(call.init?.method).toBe('GET'); expect(call.init?.body).toBeUndefined(); }
		await api.close();
	});

	it.each(['partition_keys', 'index_fields', 'full_text_search_keys', 'bloom_filter_fields', 'defined_schema_fields', 'extended_retention_days'])('rejects unsupported set for %s before HTTP, including mixed wrappers', async (key) => {
		const fetch = vi.fn(async () => Response.json({ code: 200 }));
		const api = fixture(fetch);
		for (const wrapper of [{ set: [] }, { add: [], set: [] }, { remove: [], set: [] }]) {
			await expect(api.updateStreamSettings({ stream: 'app', settings: { [key]: wrapper } } as never)).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		}
		expect(fetch).not.toHaveBeenCalled();
		await api.close();
	});

	it.each([
		'cluster', null, {}, { field: '' }, { field: ' ' }, { field: 1 }, { field: 'x\n' }, { field: 'x'.repeat(257) },
		{ field: 'id', types: 'hash' }, { field: 'id', types: null }, { field: 'id', types: {} },
		{ field: 'id', types: { hash: 0 } }, { field: 'id', types: { hash: -1 } }, { field: 'id', types: { hash: 1.5 } },
		{ field: 'id', types: { hash: '32' } }, { field: 'id', types: { hash: Number.MAX_SAFE_INTEGER + 1 } },
		{ field: 'id', types: { hash: Infinity } }, { field: 'id', types: { hash: 16, other: true } }, { field: 'id', disabled: 'false' },
	])('rejects invalid partition objects for both mutations and reads: %#', async (partition) => {
		const fetch = vi.fn(async () => Response.json({ code: 200 }));
		const api = fixture(fetch);
		for (const operation of ['add', 'remove']) {
			await expect(api.updateStreamSettings({ stream: 'app', settings: { partition_keys: { [operation]: [partition] } } } as never)).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		}
		expect(fetch).not.toHaveBeenCalled();
		await api.close();
		for (const partition_keys of [[partition], { L0: partition }]) {
			// String map values are a server-supported legacy read format.
			if (!Array.isArray(partition_keys) && typeof partition === 'string') continue;
			const read = fixture(async () => Response.json({ settings: { partition_keys } }));
			await expect(read.getStreamSettings({ stream: 'app' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
			await read.close();
		}
	});

	it.each([
		[{ field: 'cluster' }, { field: 'service', types: 'value', disabled: false }, { field: 'id', types: { hash: 1 } }, { field: 'host', types: 'prefix', disabled: true }],
		{ L0: { field: 'cluster', types: 'value', disabled: false }, L1: { field: 'id', types: { hash: Number.MAX_SAFE_INTEGER } } },
	])('reads typed partition arrays and maps: %#', async (partition_keys) => {
		const api = fixture(async () => Response.json({ settings: { partition_keys } }));
		await expect(api.getStreamSettings({ stream: 'app' })).resolves.toMatchObject({ settings: { partition_keys } });
		await api.close();
	});

	it('normalizes the server-supported legacy partition string map to DTOs', async () => {
		const api = fixture(async () => Response.json({ settings: { partition_keys: { L0: 'cluster', L1: { field: 'id', types: { hash: 16 } } } } }));
		await expect(api.getStreamSettings({ stream: 'app' })).resolves.toMatchObject({ settings: { partition_keys: { L0: { field: 'cluster', types: 'value', disabled: false }, L1: { field: 'id', types: { hash: 16 } } } } });
		await api.close();
	});

	it('validates extended operations before any network call', async () => {
		const fetch = vi.fn(async () => Response.json({}));
		const api = fixture(fetch);
		const cyclic: Record<string, unknown> = {}; cyclic.self = cyclic;
		for (const call of [
			() => api.getStreamSettings({ stream: '..' }),
			() => api.updateStreamSettings({ stream: 'app', settings: {} }),
			() => api.updateStreamSettings({ stream: 'app', settings: { index_fields: ['message'] } } as never),
			() => api.updateStreamSettings({ stream: 'app', settings: { data_retention: 2 } }),
			() => api.updateStreamSettings({ stream: 'app', settings: { index_all_values: 'yes' } } as never),
			() => api.updateStreamSettings({ stream: 'app', settings: { unknown: 'SECRET' } } as never),
			() => api.deleteStream({ stream: 'app', deleteAll: 'yes' } as never),
			() => api.ingestJson({ stream: 'app', records: [] }),
			() => api.ingestJson({ stream: 'app', records: [1] } as never),
			() => api.ingestJson({ stream: 'app', records: [cyclic] } as never),
			() => api.ingestJson({ stream: 'app', records: [{ n: Infinity }] }),
			() => api.ingestJson({ stream: 'app', records: [{ field: undefined }] } as never),
			() => api.ingestJson({ stream: 'app', records: [{ message: 'x'.repeat(1024 * 1024) }] }),
			() => api.ingestMulti({ stream: 'app', records: 'SECRET' }),
			() => api.ingestMulti({ stream: 'app', records: '{"x":1}\nnull' }),
			() => api.ingestMulti({ stream: 'app', records: '[]' }),
			() => api.getValues({ stream: 'app', fields: [], startTimeMicros: 1, endTimeMicros: 2 }),
			() => api.getValues({ stream: 'app', fields: ['a,b'], startTimeMicros: 1, endTimeMicros: 2 }),
			() => api.searchAround({ stream: 'app', key: Number.MAX_SAFE_INTEGER + 1 }),
		]) await expect(call()).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect(fetch).not.toHaveBeenCalled();
		await api.close();
	});

	it.each([{}, [], null, { code: 200, status: [] }, { code: 200, status: [{}] }, { code: 200, status: [{ name: 'app', successful: -1, failed: 0 }] }, { code: 500, status: [{ name: 'app', successful: 1, failed: 0 }] }])('rejects invalid ingestion responses: %#', async (response) => {
		const api = fixture(async () => Response.json(response));
		await expect(api.ingestJson({ stream: 'app', records: [{}] })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await expect(api.ingestMulti({ stream: 'app', records: [{}] })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await api.close();
	});

	it.each([{}, { code: 500 }, { code: '200' }, { code: 200, message: {} }])('rejects invalid mutation acknowledgements: %#', async (response) => {
		const api = fixture(async () => Response.json(response));
		await expect(api.deleteStream({ stream: 'app' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await expect(api.updateStreamSettings({ stream: 'app', settings: { data_retention: 3 } })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await api.close();
	});

	it.each([{}, { settings: [] }, { settings: null }, { settings: { full_text_search_keys: 'message' } }, { settings: { data_retention: -1 } }, { settings: { store_original_data: 1 } }])('rejects invalid settings response shapes: %#', async (response) => {
		const api = fixture(async () => Response.json(response));
		await expect(api.getStreamSettings({ stream: 'app' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await api.close();
	});

	it.each([{}, { hits: {} }, { hits: [{}] }, { hits: [{ field: 'other', values: [] }] }, { hits: [{ field: 'service', values: [{}] }] }, { hits: [{ field: 'service', values: [{ zo_sql_key: 'api', zo_sql_num: -1 }] }] }, { hits: [], size: -1 }])('rejects invalid values response shapes: %#', async (response) => {
		const api = fixture(async () => Response.json(response));
		await expect(api.getValues({ stream: 'app', fields: ['service'], startTimeMicros: 1, endTimeMicros: 2 })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await api.close();
	});

	it.each([{}, { hits: null }, { hits: [], size: 1001 }, { hits: [], from: 1 }])('rejects invalid around response shapes: %#', async (response) => {
		const api = fixture(async () => Response.json(response));
		await expect(api.searchAround({ stream: 'app', key: 1 })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await api.close();
	});
});
