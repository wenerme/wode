import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import { createServiceRuntime, ServiceProviderRegistry } from '../runtime';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { OpenObserveServiceProvider } from './index';

function runtime(options: Record<string, unknown> = { organization: 'tenant', accessTokenEnv: 'OO_FIXTURE_TOKEN' }, readOnly = true) {
	const getEnv = vi.fn((name: string) => (name === 'OO_FIXTURE_TOKEN' ? 'PRIVATE_TOKEN' : undefined));
	const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({ hits: [], total: 0 }));
	const context = {
		services: normalizeCliServices([{ name: 'observe', type: 'oo', readOnly, baseUrl: 'https://observe.example.test', options }]),
	};
	return {
		fetch,
		getEnv,
		runtime: createServiceRuntime({
			context,
			providers: new ServiceProviderRegistry([createServiceProviderAdapter(OpenObserveServiceProvider)]),
			fetch: fetch as unknown as typeof globalThis.fetch,
			getEnv,
		}),
	};
}
describe('OpenObserve service provider', () => {
	it('validates settings before constructing the credential-bearing client', async () => {
		const test = runtime(undefined, false);
		try {
			await expect(test.runtime.call({ params: { service: 'observe' }, body: { toolName: 'updateStreamSettings', input: { stream: 'app', settings: { data_retention: 1 } } } })).rejects.toThrow('Invalid OpenObserve input');
			expect(test.getEnv).not.toHaveBeenCalled();
			expect(test.fetch).not.toHaveBeenCalled();
		} finally { await test.runtime.close(); }
	});
	it('discovers read-only tools without resolving secrets and reuses a lazily created client', async () => {
		const test = runtime();
		try {
			const schema = await test.runtime.getSchema({ params: { service: 'observe' } });
			expect(Object.keys(schema.tools)).toEqual(['health', 'status', 'listStreams', 'getStreamSchema', 'search', 'listTraces', 'getStreamSettings', 'updateStreamSettings', 'deleteStream', 'ingestJson', 'ingestMulti', 'getValues', 'searchAround']);
			expect(schema.tools.search.annotations?.readOnlyHint).toBe(true);
			expect(schema.tools.ingestJson.annotations?.readOnlyHint).toBe(false);
			expect(schema.tools.deleteStream.annotations?.destructiveHint).toBe(true);
			expect(test.getEnv).not.toHaveBeenCalled();
			expect(test.fetch).not.toHaveBeenCalled();
			for (let call = 0; call < 2; call++)
				await test.runtime.call({
					params: { service: 'observe' },
					body: { toolName: 'search', input: { sql: 'SELECT 1', startTimeMicros: 1, endTimeMicros: 2 } },
				});
			expect(test.getEnv).toHaveBeenCalledExactlyOnceWith('OO_FIXTURE_TOKEN');
			expect(new Headers(test.fetch.mock.calls[0]?.[1]?.headers).get('authorization')).toBe('Bearer PRIVATE_TOKEN');
		} finally {
			await test.runtime.close();
		}
	});
	it.each([
		{ timeoutMs: '30000' },
		{ username: 42 },
		{ unknown: 'PRIVATE' },
		{ accessToken: 'PRIVATE', accessTokenEnv: 'OO_FIXTURE_TOKEN' },
		{ accessTokenEnv: 'MISSING_TOKEN' },
	])('rejects malformed or unavailable configuration without HTTP: %j', async (options) => {
		const test = runtime(options);
		try {
			await expect(
				test.runtime.call({
					params: { service: 'observe' },
					body: { toolName: 'search', input: { sql: 'SELECT 1', startTimeMicros: 1, endTimeMicros: 2 } },
				}),
			).rejects.toThrow('Failed to create service');
			expect(test.fetch).not.toHaveBeenCalled();
		} finally {
			await test.runtime.close();
		}
	});
	it('rejects schema-invalid inputs before credentials or dispatch', async () => {
		const test = runtime();
		try {
			await expect(
				test.runtime.call({
					params: { service: 'observe' },
					body: { toolName: 'search', input: { sql: 'SELECT 1', size: -1 } },
				}),
			).rejects.toThrow('Invalid OpenObserve input');
			expect(test.getEnv).not.toHaveBeenCalled();
			expect(test.fetch).not.toHaveBeenCalled();
		} finally {
			await test.runtime.close();
		}
	});
	it('blocks writes on both the typed service and transport boundary', async () => {
		const test = runtime();
		try {
			await expect(test.runtime.call({ params: { service: 'observe' }, body: { toolName: 'ingestJson', input: { stream: 'app', records: [{ message: 'fixture' }] } } })).rejects.toThrow('read-only');
			expect(test.getEnv).not.toHaveBeenCalled();
			expect(test.fetch).not.toHaveBeenCalled();
		} finally { await test.runtime.close(); }
		const client = await OpenObserveServiceProvider.create({ name: 'observe', config: { provider: 'openobserve', readOnly: true, baseUrl: 'https://observe.example.test', options: { accessToken: 'FIXTURE_TOKEN' } }, context: { services: {} }, fetch: test.fetch as unknown as typeof globalThis.fetch });
		try { await expect(client.openobserve.deleteStream({ stream: 'app' })).rejects.toThrow('read-only'); }
		finally { await client.openobserve.close(); }
		expect(test.fetch).not.toHaveBeenCalled();
	});
});
