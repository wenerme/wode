import { describe, expect, it, vi } from 'vitest';
import { ServiceRegistry, type ServiceProviderDefinition } from '../registry';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { GrafanaTools } from '../runtime/grafana-tools';
import { type IGrafanaService, GrafanaServiceProvider } from './index';
import { GrafanaOperations } from './operations';

describe('Grafana registered operations', () => {
	it('covers every existing method with typed input and call options', async () => {
		const service: IGrafanaService = {
			type: 'grafana', readOnly: true,
			health: vi.fn(async () => ({ database: 'ok' })),
			whoAmI: vi.fn(async () => ({ login: 'admin' })),
			request: vi.fn(async () => ({ status: 'success' })),
			close: vi.fn(async () => {}),
		};
		const definition: ServiceProviderDefinition<'grafana'> = { ...GrafanaServiceProvider, create: () => ({ grafana: service }) };
		const registry = new ServiceRegistry({ context: { services: { metrics: { provider: 'grafana', readOnly: true } } } });
		registry.register(definition);
		const options = { signal: new AbortController().signal };
		for (const test of [
			{ operation: GrafanaOperations.health, input: {}, invoke: service.health, args: [options] },
			{ operation: GrafanaOperations.whoAmI, input: {}, invoke: service.whoAmI, args: [options] },
			{ operation: GrafanaOperations.request, input: { path: '/api/search' }, invoke: service.request, args: [{ path: '/api/search' }, options] },
		]) {
			await test.operation.execute(registry, 'metrics', test.input, options);
			expect(test.invoke).toHaveBeenCalledExactlyOnceWith(...test.args);
		}
		expect(createServiceProviderAdapter(definition).tools).toEqual(GrafanaTools);
		expect(Object.keys(GrafanaOperations)).toEqual(Object.keys(GrafanaTools));
		await registry.close();
		expect(service.close).toHaveBeenCalledTimes(1);
	});

	it.each(['unknown', 'input', 'cancelled'])('rejects %s before credentials or HTTP', async (kind) => {
		const config = { provider: 'grafana', readOnly: true, baseUrl: 'https://grafana.example.test', options: { accessTokenEnv: 'GRAFANA_TEST_TOKEN' } };
		const getEnv = vi.fn(() => 'fixture-token');
		const fetch = vi.fn<typeof globalThis.fetch>();
		const client = await createServiceProviderAdapter(GrafanaServiceProvider).create({
			name: 'metrics', config, context: { services: { metrics: config } }, fetch, getEnv,
		});
		const controller = new AbortController();
		if (kind === 'cancelled') controller.abort();
		await expect(client.call(kind === 'unknown' ? 'missing' : 'request', kind === 'input' ? { path: 'relative' } : { path: '/api/search' }, { signal: controller.signal })).rejects.toThrow();
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		await client.close?.();
	});

	it('rejects writes from a read-only configured service before HTTP', async () => {
		const config = { provider: 'grafana', readOnly: true, baseUrl: 'https://grafana.example.test' };
		const fetch = vi.fn<typeof globalThis.fetch>();
		const client = await createServiceProviderAdapter(GrafanaServiceProvider).create({
			name: 'metrics', config, context: { services: { metrics: config } }, fetch,
		});
		await expect(client.call('request', { path: '/api/dashboards/db', method: 'POST', body: {} })).rejects.toThrow('read-only');
		expect(fetch).not.toHaveBeenCalled();
		await client.close?.();
	});
});
