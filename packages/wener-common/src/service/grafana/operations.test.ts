import { describe, expect, it, vi } from 'vitest';
import { ServiceRegistry, type ServiceProviderDefinition } from '../registry';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { type IGrafanaService, GrafanaServiceProvider } from './index';
import { GrafanaOperations } from './operations';

describe('Grafana registered operations', () => {
	it('covers every existing method with typed input and call options', async () => {
		const service: IGrafanaService = {
			type: 'grafana', readOnly: true,
			health: vi.fn(async () => ({ database: 'ok' })),
			whoAmI: vi.fn(async () => ({ login: 'admin' })),
			request: vi.fn(async () => ({ status: 'success' })),
			listDashboard: vi.fn(async () => [{ uid: 'dash-1' }]),
			getDashboard: vi.fn(async () => ({ dashboard: { uid: 'dash-1' } })),
			updateDashboard: vi.fn(async () => ({ uid: 'dash-1', status: 'success' })),
			getPanel: vi.fn(async () => ({ id: 1, title: 'Panel' })),
			patchPanel: vi.fn(async () => ({ uid: 'dash-1', status: 'success' })),
			close: vi.fn(async () => {}),
			[Symbol.asyncDispose]: vi.fn(async () => {}),
		};
		const definition: ServiceProviderDefinition<IGrafanaService> = { ...GrafanaServiceProvider, create: () => ({ grafana: service }) };
		const registry = new ServiceRegistry({ context: { services: { metrics: { provider: 'grafana', readOnly: true } } } });
		registry.register(definition);
		const options = { signal: new AbortController().signal };
		for (const test of [
			{ operation: GrafanaOperations.health, input: {}, invoke: service.health, args: [options] },
			{ operation: GrafanaOperations.whoAmI, input: {}, invoke: service.whoAmI, args: [options] },
			{ operation: GrafanaOperations.request, input: { path: '/api/search' }, invoke: service.request, args: [{ path: '/api/search' }, options] },
			{ operation: GrafanaOperations.listDashboard, input: { query: 'cpu' }, invoke: service.listDashboard, args: [{ query: 'cpu' }, options] },
			{ operation: GrafanaOperations.getDashboard, input: { uid: 'dash-1' }, invoke: service.getDashboard, args: [{ uid: 'dash-1' }, options] },
			{ operation: GrafanaOperations.updateDashboard, input: { dashboard: { uid: 'dash-1' } }, invoke: service.updateDashboard, args: [{ dashboard: { uid: 'dash-1' } }, options] },
			{ operation: GrafanaOperations.getPanel, input: { dashboardUid: 'dash-1', panelId: 1 }, invoke: service.getPanel, args: [{ dashboardUid: 'dash-1', panelId: 1 }, options] },
			{ operation: GrafanaOperations.patchPanel, input: { dashboardUid: 'dash-1', panelId: 1, set: { title: 'x' } }, invoke: service.patchPanel, args: [{ dashboardUid: 'dash-1', panelId: 1, set: { title: 'x' } }, options] },
		]) {
			await test.operation.execute(registry, 'metrics', test.input, options);
			expect(test.invoke).toHaveBeenCalledExactlyOnceWith(...test.args);
		}
		const tools = createServiceProviderAdapter(definition).tools!;
		expect(Object.keys(tools)).toEqual(['health', 'whoAmI', 'request', 'listDashboard', 'getDashboard', 'updateDashboard', 'getPanel', 'patchPanel']);
		expect(Object.keys(GrafanaOperations)).toEqual(Object.keys(tools));
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
