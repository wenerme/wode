import { describe, expect, it, vi } from 'vitest';
import { GrafanaClient } from '@wener/client/grafana';
import type { ServiceRuntimeClient } from '../runtime/types';
import { createGrafanaServiceToolClient } from './client';
import type { IGrafanaService } from './IGrafanaService';

function runtime(call: ServiceRuntimeClient['call']) {
	return {
		getSchema: vi.fn(async () => ({ tools: { health: { inputSchema: {}, annotations: { readOnlyHint: true } }, request: { inputSchema: {} } } })),
		call: vi.fn(call),
	};
}

describe('createGrafanaServiceToolClient', () => {
	it('enforces per-call timeout even when runtime ignores abort', async () => {
		const pending = runtime(() => new Promise(() => undefined));
		const service = await createGrafanaServiceToolClient(pending, 'metrics');
		await expect(service.health(undefined, { context: { timeoutMs: 5 } })).rejects.toThrow('timed out');
		await service.close();
	});

	it.each(['health', 'whoami', 'listDashboard'] as const)('normalizes omitted %s input using the contract default', async (toolName) => {
		const transport = {
			getSchema: vi.fn(async () => ({ tools: { [toolName]: { inputSchema: {} } } })),
			call: vi.fn(async () => toolName === 'listDashboard' ? [] : {}),
		};
		const service = await createGrafanaServiceToolClient(transport, 'metrics');
		await service[toolName]();
		expect(transport.call).toHaveBeenCalledWith({ params: { service: 'metrics' }, body: { toolName, input: {} } }, expect.objectContaining({ signal: expect.any(AbortSignal) }));
		await service.close();
	});

	it('forwards cancellation from the native oRPC options position', async () => {
		const pending = runtime(() => new Promise(() => undefined));
		const service = await createGrafanaServiceToolClient(pending, 'metrics');
		const controller = new AbortController();
		const request = service.health(undefined, { signal: controller.signal });
		controller.abort(new Error('Fixture cancellation'));
		await expect(request).rejects.toThrow('Fixture cancellation');
		expect(pending.call.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
		await service.close();
	});

	it('rejects an already-aborted native call before remote dispatch', async () => {
		const resolved = runtime(async () => ({}));
		const service = await createGrafanaServiceToolClient(resolved, 'metrics');
		const controller = new AbortController();
		controller.abort(new Error('Fixture cancellation'));
		await expect(service.health(undefined, { signal: controller.signal })).rejects.toThrow('Fixture cancellation');
		expect(resolved.call).not.toHaveBeenCalled();
		await service.close();
	});

	it('closes an in-flight runtime call without waiting for the transport', async () => {
		const pending = runtime(() => new Promise(() => undefined));
		const service = await createGrafanaServiceToolClient(pending, 'metrics');
		const request = service.health();
		await service.close();
		await expect(request).rejects.toThrow('closed');
	});

	it('rejects a write request when the client is read-only', async () => {
		const resolved = runtime(async () => ({}));
		const service = await createGrafanaServiceToolClient(resolved, 'metrics', { readOnly: true });
		await expect(service.request({ path: '/api/dashboards/db', method: 'POST', body: {} })).rejects.toThrow('read-only');
	});

	it('allows a write request when the client is writable', async () => {
		const resolved = runtime(async () => ({ id: 1 }));
		const service = await createGrafanaServiceToolClient(resolved, 'metrics', { readOnly: false });
		await expect(service.request({ path: '/api/dashboards/db', method: 'POST', body: {} })).resolves.toEqual({ id: 1 });
	});

	it('validates a typed panel result and preserves plugin extension fields', async () => {
		const payload = { changed: true, panel: { id: 1, options: { custom: 'kept' } }, dashboard: { uid: 'dash-1', version: 2 }, dryRun: true };
		const transport = {
			getSchema: vi.fn(async () => ({ tools: { patchPanel: { inputSchema: {}, annotations: { supportsDryRun: true } } } })),
			call: vi.fn(async () => payload),
		};
		const service = await createGrafanaServiceToolClient(transport, 'metrics');
		expect(await service.patchPanel({ dashboardUid: 'dash-1', panelId: 1, set: { title: 'CPU' }, dryRun: true })).toEqual(payload);
		await service.close();
	});

	it('rejects malformed remote outputs without exposing response contents', async () => {
		const transport = {
			getSchema: vi.fn(async () => ({ tools: { listPanel: { inputSchema: {} } } })),
			call: vi.fn(async () => [{ id: 'invalid', secret: 'fixture-private-response' }]),
		};
		const service = await createGrafanaServiceToolClient(transport, 'metrics');
		await expect(service.listPanel({ dashboardUid: 'dash-1' })).rejects.toThrow('Invalid Grafana response');
		await service.close();
	});

	it('rejects an invalid edit mode before dispatching a remote call', async () => {
		const transport = {
			getSchema: vi.fn(async () => ({ tools: { patchPanel: { inputSchema: {} } } })),
			call: vi.fn(async () => ({})),
		};
		const service = await createGrafanaServiceToolClient(transport, 'metrics', { readOnly: false });
		await expect(service.patchPanel({ dashboardUid: 'dash-1', panelId: 1 } as never)).rejects.toThrow('Invalid Grafana input');
		expect(transport.call).not.toHaveBeenCalled();
		await service.close();
	});

	it.each(['set', 'merge'])('rejects raw %s prototype keys before remote dispatch', async (mode) => {
		const transport = {
			getSchema: vi.fn(async () => ({ tools: { patchPanel: { inputSchema: {}, annotations: { supportsDryRun: true } } } })),
			call: vi.fn(async () => ({})),
		};
		const service = await createGrafanaServiceToolClient(transport, 'metrics');
		const edit = JSON.parse('{"__proto__":{"polluted":true},"title":"CPU"}');
		await expect(service.patchPanel({ dashboardUid: 'd', panelId: 1, [mode]: edit, dryRun: true } as never)).rejects.toThrow('Invalid Grafana input');
		expect(transport.call).not.toHaveBeenCalled();
		await service.close();
	});

	it.each([
		{ tool: 'whoami', value: { id: 1.5 }, invoke: (service: Pick<IGrafanaService, 'whoami'>) => service.whoami() },
		{ tool: 'listDashboard', value: [{ uid: 'd', id: 1.5 }], invoke: (service: Pick<IGrafanaService, 'listDashboard'>) => service.listDashboard() },
		{ tool: 'getDashboard', value: { dashboard: { version: -1 } }, invoke: (service: Pick<IGrafanaService, 'getDashboard'>) => service.getDashboard({ uid: 'd' }) },
		{ tool: 'updateDashboard', value: { uid: 'd', version: 1.5 }, invoke: (service: Pick<IGrafanaService, 'updateDashboard'>) => service.updateDashboard({ dashboard: {} }) },
	])('rejects the same invalid $tool response on direct and remote paths', async ({ tool, value, invoke }) => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json(value));
		const http = new GrafanaClient({ baseUrl: 'https://grafana.example.test', fetch });
		const transport = {
			getSchema: vi.fn(async () => ({ tools: { [tool]: { inputSchema: {} } } })),
			call: vi.fn(async () => invoke(http)),
		};
		const remote = await createGrafanaServiceToolClient(transport, 'metrics', { readOnly: false });
		await expect(invoke(http)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		await expect(invoke(remote)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
		expect(fetch).toHaveBeenCalledTimes(2);
		await remote.close();
		await http.close();
	});
});
