import { describe, expect, it, vi } from 'vitest';
import type { ServiceRuntimeClient } from '../runtime/types';
import { createPrometheusServiceToolClient } from './client';

function runtime(call: ServiceRuntimeClient['call']) {
	return {
		getSchema: vi.fn(async () => ({ tools: { query: { inputSchema: {}, annotations: { readOnlyHint: true } } } })),
		call: vi.fn(call),
	};
}

describe('createPrometheusServiceToolClient', () => {
	it('enforces per-call timeout even when runtime ignores abort', async () => {
		const pending = runtime(() => new Promise(() => undefined));
		const service = await createPrometheusServiceToolClient(pending, 'metrics');
		await expect(service.query({ query: 'up' }, { context: { timeoutMs: 5 } })).rejects.toThrow('timed out');
		await service.close();
	});

	it('closes an in-flight runtime call without waiting for the transport', async () => {
		const pending = runtime(() => new Promise(() => undefined));
		const service = await createPrometheusServiceToolClient(pending, 'metrics');
		const request = service.query({ query: 'up' });
		await service.close();
		await expect(request).rejects.toThrow('closed');
	});
	it.each(['labels', 'metadata'] as const)('normalizes omitted %s input using the contract default', async (toolName) => {
		const transport = {
			getSchema: vi.fn(async () => ({ tools: { [toolName]: { inputSchema: {} } } })),
			call: vi.fn(async () => toolName === 'labels' ? { status: 'success', data: [], warnings: [] } : { status: 'success', data: {}, warnings: [] }),
		};
		const service = await createPrometheusServiceToolClient(transport, 'metrics');
		await service[toolName]();
		expect(transport.call).toHaveBeenCalledWith({ params: { service: 'metrics' }, body: { toolName, input: {} } }, expect.objectContaining({ signal: expect.any(AbortSignal) }));
		await service.close();
	});

	it('forwards cancellation from the native oRPC options position', async () => {
		const pending = runtime(() => new Promise(() => undefined));
		const service = await createPrometheusServiceToolClient(pending, 'metrics');
		const controller = new AbortController();
		const request = service.query({ query: 'up' }, { signal: controller.signal });
		controller.abort(new Error('Fixture cancellation'));
		await expect(request).rejects.toThrow('Fixture cancellation');
		expect(pending.call.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
		await service.close();
	});

	it('rejects malformed remote outputs using the contract schema', async () => {
		const transport = {
			getSchema: vi.fn(async () => ({ tools: { query: { inputSchema: {} } } })),
			call: vi.fn(async () => ({ status: 'success', data: { resultType: 'scalar', result: [1, 2] }, warnings: [] })),
		};
		const service = await createPrometheusServiceToolClient(transport, 'metrics');
		await expect(service.query({ query: 'up' })).rejects.toThrow('Invalid Prometheus response');
		await service.close();
	});
});
