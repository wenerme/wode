import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import { ServiceRegistry } from '../registry';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import { PrometheusServiceCapability, PrometheusServiceProvider } from './index';

function runtime(options: Record<string, unknown> = { accessTokenEnv: 'PROM_FIXTURE_TOKEN' }, readOnly = true) {
	const getEnv = vi.fn((name: string) => name === 'PROM_FIXTURE_TOKEN' ? 'fixture-token' : undefined);
	const fetch = vi.fn<FetchLike>(async (_input, _init) => Response.json({ status: 'success', data: { resultType: 'scalar', result: [1, '1'] } }));
	const service = normalizeCliServices([{ name: 'metrics', type: 'prom', readOnly, baseUrl: 'https://metrics.example.test', options }]);
	const runtime = createServiceRuntime({
		context: { services: service },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(PrometheusServiceProvider)]),
		fetch: fetch as unknown as typeof globalThis.fetch,
		getEnv,
	});
	return { runtime, fetch, getEnv };
}

describe('Prometheus service provider', () => {
	it('maps the oRPC client timeout context to the local HTTP client', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(() => new Promise(() => undefined));
		const services = normalizeCliServices([{ name: 'metrics', type: 'prom', baseUrl: 'https://metrics.example.test' }]);
		const registry = new ServiceRegistry({ context: { services }, fetch });
		registry.register(PrometheusServiceProvider);
		const service = await registry.load(PrometheusServiceCapability, 'metrics');
		await expect(service.query({ query: 'up' }, { context: { timeoutMs: 5 } })).rejects.toMatchObject({ code: 'TIMEOUT' });
		expect(fetch).toHaveBeenCalledTimes(1);
		await registry.close();
	});

	it('discovers a complete read-only schema without env or network access', async () => {
		const test = runtime();
		const schema = await test.runtime.getSchema({ params: { service: 'metrics' } });
		expect(Object.keys(schema.tools)).toEqual(['query', 'queryRange', 'series', 'labels', 'labelValues', 'metadata']);
		expect(schema.tools.query.annotations?.readOnlyHint).toBe(true);
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('resolves env only on dispatch and routes the typed operation', async () => {
		const test = runtime();
		const result = await test.runtime.call({ params: { service: 'metrics' }, body: { toolName: 'query', input: { query: 'up' } } });
		expect(result).toMatchObject({ status: 'success', data: { resultType: 'scalar' } });
		expect(test.getEnv).toHaveBeenCalledExactlyOnceWith('PROM_FIXTURE_TOKEN');
		expect(new Headers(test.fetch.mock.calls[0]?.[1]?.headers).get('authorization')).toBe('Bearer fixture-token');
		await test.runtime.close();
	});

	it('rejects writable configuration before credentials or HTTP', async () => {
		const test = runtime(undefined, false);
		await expect(test.runtime.call({ params: { service: 'metrics' }, body: { toolName: 'query', input: { query: 'up' } } })).rejects.toThrow('Failed to create service');
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});
});
