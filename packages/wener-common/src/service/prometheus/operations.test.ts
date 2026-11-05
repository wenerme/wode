import { describe, expect, it, vi } from 'vitest';
import { ServiceRegistry, type ServiceProviderDefinition } from '../registry';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { PrometheusTools } from '../runtime/prometheus-tools';
import { type IPrometheusService, PrometheusServiceProvider } from './index';
import { PrometheusOperations } from './operations';

describe('Prometheus registered operations', () => {
	it('covers every existing method with typed input and call options', async () => {
		const query = { status: 'success' as const, data: { resultType: 'vector' as const, result: [] }, warnings: [] };
		const service: IPrometheusService = {
			type: 'prometheus', readOnly: true,
			query: vi.fn(async () => query), queryRange: vi.fn(async () => query),
			series: vi.fn(async () => ({ status: 'success' as const, data: [], warnings: [] })),
			labels: vi.fn(async () => ({ status: 'success' as const, data: [], warnings: [] })),
			labelValues: vi.fn(async () => ({ status: 'success' as const, data: [], warnings: [] })),
			metadata: vi.fn(async () => ({ status: 'success' as const, data: {}, warnings: [] })), close: vi.fn(async () => {}),
		};
		const definition: ServiceProviderDefinition<'prometheus'> = { ...PrometheusServiceProvider, create: () => ({ prometheus: service }) };
		const registry = new ServiceRegistry({ context: { services: { metrics: { provider: 'prometheus', readOnly: true } } } });
		registry.register(definition);
		const options = { signal: new AbortController().signal };
		for (const test of [
			{ operation: PrometheusOperations.query, input: { query: 'up', time: 1 }, invoke: service.query },
			{ operation: PrometheusOperations.queryRange, input: { query: 'up', start: 0, end: 60, step: 10 }, invoke: service.queryRange },
			{ operation: PrometheusOperations.series, input: { match: ['up'] }, invoke: service.series },
			{ operation: PrometheusOperations.labels, input: {}, invoke: service.labels },
			{ operation: PrometheusOperations.labelValues, input: { label: 'job' }, invoke: service.labelValues },
			{ operation: PrometheusOperations.metadata, input: { metric: 'up', limit: 1 }, invoke: service.metadata },
		]) {
			await test.operation.execute(registry, 'metrics', test.input, options);
			expect(test.invoke).toHaveBeenCalledExactlyOnceWith(test.input, options);
		}
		expect(createServiceProviderAdapter(definition).tools).toEqual(PrometheusTools);
		expect(Object.keys(PrometheusOperations)).toEqual(Object.keys(PrometheusTools));
		await registry.close();
		expect(service.close).toHaveBeenCalledTimes(1);
	});

	it.each(['unknown', 'input', 'cancelled'])('rejects %s before credentials or HTTP', async (kind) => {
		const config = { provider: 'prometheus', readOnly: true, baseUrl: 'https://metrics.example.test', options: { accessTokenEnv: 'PROM_TEST_TOKEN' } };
		const getEnv = vi.fn(() => 'fixture-token');
		const fetch = vi.fn<typeof globalThis.fetch>();
		const client = await createServiceProviderAdapter(PrometheusServiceProvider).create({
			name: 'metrics', config, context: { services: { metrics: config } }, fetch, getEnv,
		});
		const controller = new AbortController();
		if (kind === 'cancelled') controller.abort();
		await expect(client.call(kind === 'unknown' ? 'missing' : 'query', kind === 'input' ? { query: '' } : { query: 'up' }, { signal: controller.signal })).rejects.toThrow();
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		await client.close?.();
	});
});
