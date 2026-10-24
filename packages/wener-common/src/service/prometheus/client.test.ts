import { describe, expect, it, vi } from 'vitest';
import { createPrometheusServiceToolClient } from './client';

function runtime(call: () => Promise<unknown>) {
	return {
		getSchema: vi.fn(async () => ({ tools: { query: { inputSchema: {}, annotations: { readOnlyHint: true } } } })),
		call: vi.fn(call),
	};
}

describe('createPrometheusServiceToolClient', () => {
	it('enforces per-call timeout even when runtime ignores abort', async () => {
		const pending = runtime(() => new Promise(() => undefined));
		const service = await createPrometheusServiceToolClient(pending, 'metrics');
		await expect(service.query({ query: 'up' }, { timeoutMs: 5 })).rejects.toThrow('timed out');
		await service.close();
	});

	it('closes an in-flight runtime call without waiting for the transport', async () => {
		const pending = runtime(() => new Promise(() => undefined));
		const service = await createPrometheusServiceToolClient(pending, 'metrics');
		const request = service.query({ query: 'up' });
		await service.close();
		await expect(request).rejects.toThrow('closed');
	});
});
