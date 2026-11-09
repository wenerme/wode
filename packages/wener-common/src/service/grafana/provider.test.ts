import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import { GrafanaServiceProvider } from './index';

function runtime(options: Record<string, unknown> = { accessTokenEnv: 'GRAFANA_FIXTURE_TOKEN' }, readOnly = true) {
	const getEnv = vi.fn((name: string) => name === 'GRAFANA_FIXTURE_TOKEN' ? 'fixture-token' : undefined);
	const fetch = vi.fn<FetchLike>(async () => Response.json({ database: 'ok' }));
	const service = normalizeCliServices([{ name: 'metrics', type: 'grafana', readOnly, baseUrl: 'https://grafana.example.test', options }]);
	const runtime = createServiceRuntime({
		context: { services: service },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(GrafanaServiceProvider)]),
		fetch: fetch as unknown as typeof globalThis.fetch,
		getEnv,
	});
	return { runtime, fetch, getEnv };
}

describe('Grafana service provider', () => {
	it('discovers a complete schema without env or network access', async () => {
		const test = runtime();
		const schema = await test.runtime.getSchema({ params: { service: 'metrics' } });
		expect(Object.keys(schema.tools)).toEqual(['health', 'whoAmI', 'request', 'listDashboard', 'getDashboard', 'updateDashboard', 'getPanel', 'patchPanel']);
		expect(schema.tools.health.annotations?.readOnlyHint).toBe(true);
		expect(schema.tools.request.annotations?.readOnlyHint).toBe(false);
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('resolves env only on dispatch and routes the typed operation', async () => {
		const test = runtime();
		const result = await test.runtime.call({ params: { service: 'metrics' }, body: { toolName: 'health', input: {} } });
		expect(result).toMatchObject({ database: 'ok' });
		expect(test.getEnv).toHaveBeenCalledExactlyOnceWith('GRAFANA_FIXTURE_TOKEN');
		expect(new Headers(test.fetch.mock.calls[0]?.[1]?.headers).get('authorization')).toBe('Bearer fixture-token');
		await test.runtime.close();
	});

	it('allows reads but rejects writes when the service is read-only', async () => {
		const test = runtime(undefined, true);
		await expect(
			test.runtime.call({ params: { service: 'metrics' }, body: { toolName: 'request', input: { path: '/api/dashboards/db', method: 'POST', body: {} } } }),
		).rejects.toThrow();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('allows writes when the service is configured writable', async () => {
		const test = runtime(undefined, false);
		const result = await test.runtime.call({ params: { service: 'metrics' }, body: { toolName: 'request', input: { path: '/api/dashboards/db', method: 'POST', body: { title: 'x' } } } });
		expect(result).toMatchObject({ database: 'ok' });
		await test.runtime.close();
	});

	it.each(['updateDashboard', 'patchPanel'])('rejects %s from a read-only configured service before HTTP', async (toolName) => {
		const test = runtime(undefined, true);
		const input = toolName === 'updateDashboard' ? { dashboard: { uid: 'dash-1' } } : { dashboardUid: 'dash-1', panelId: 1, set: { title: 'x' } };
		await expect(test.runtime.call({ params: { service: 'metrics' }, body: { toolName, input } })).rejects.toThrow('read-only');
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('allows updateDashboard when the service is configured writable', async () => {
		const test = runtime(undefined, false);
		const result = await test.runtime.call({ params: { service: 'metrics' }, body: { toolName: 'updateDashboard', input: { dashboard: { uid: 'dash-1' } } } });
		expect(result).toMatchObject({ database: 'ok' });
		await test.runtime.close();
	});

	it.each(['updateDashboard', 'patchPanel'])('allows %s dryRun:true on a read-only configured service without HTTP writes', async (toolName) => {
		const test = runtime(undefined, true);
		const input = toolName === 'updateDashboard'
			? { dashboard: { uid: 'dash-1' }, dryRun: true }
			: { dashboardUid: 'dash-1', panelId: 1, set: { title: 'x' }, dryRun: true };
		if (toolName === 'patchPanel') {
			// patchPanel still needs to GET the dashboard to compute the preview.
			test.fetch.mockResolvedValueOnce(Response.json({ dashboard: { uid: 'dash-1', panels: [{ id: 1, title: 'a' }] } }));
		}
		const result = await test.runtime.call({ params: { service: 'metrics' }, body: { toolName, input } });
		expect(result).toMatchObject({ dryRun: true });
		expect(test.fetch.mock.calls.every((call) => call[1]?.method !== 'POST')).toBe(true);
		await test.runtime.close();
	});

	it('rejects generic request dryRun:true on a read-only configured service before HTTP', async () => {
		const test = runtime(undefined, true);
		await expect(
			test.runtime.call({
				params: { service: 'metrics' },
				body: { toolName: 'request', input: { path: '/api/dashboards/db', method: 'POST', body: { dryRun: true } } },
			}),
		).rejects.toThrow('read-only');
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});
});
