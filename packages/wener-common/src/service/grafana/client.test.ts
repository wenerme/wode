import { describe, expect, it, vi } from 'vitest';
import { createGrafanaServiceToolClient } from './client';

function runtime(call: () => Promise<unknown>) {
	return {
		getSchema: vi.fn(async () => ({ tools: { health: { inputSchema: {}, annotations: { readOnlyHint: true } }, request: { inputSchema: {} } } })),
		call: vi.fn(call),
	};
}

describe('createGrafanaServiceToolClient', () => {
	it('enforces per-call timeout even when runtime ignores abort', async () => {
		const pending = runtime(() => new Promise(() => undefined));
		const service = await createGrafanaServiceToolClient(pending, 'metrics');
		await expect(service.health({ timeoutMs: 5 })).rejects.toThrow('timed out');
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
});
