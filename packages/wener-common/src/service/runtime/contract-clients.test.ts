import { describe, expect, it, vi } from 'vitest';
import { createTencentClsServiceToolClient } from '../cls/client';
import { createGrafanaServiceToolClient } from '../grafana/client';
import { createPrometheusServiceToolClient } from '../prometheus/client';
import { createRedisServiceToolClient } from '../redis/client';
import { createTelegramServiceToolClient } from '../telegram/client';
import type { ServiceRuntimeClient } from './types';

function lifecycle(client: AsyncDisposable & { close(): Promise<void> }, request: () => Promise<unknown>) {
	return {
		request,
		close: () => client.close(),
		dispose: () => client[Symbol.asyncDispose](),
	};
}

const cases = [
	{
		name: 'Grafana', toolName: 'health', output: { database: 'ok' },
		create: async (runtime: ServiceRuntimeClient) => {
			const client = await createGrafanaServiceToolClient(runtime, 'fixture');
			return lifecycle(client, () => client.health());
		},
	},
	{
		name: 'Prometheus', toolName: 'labels', output: { status: 'success', data: [], warnings: [] },
		create: async (runtime: ServiceRuntimeClient) => {
			const client = await createPrometheusServiceToolClient(runtime, 'fixture');
			return lifecycle(client, () => client.labels());
		},
	},
	{
		name: 'Redis', toolName: 'ping', output: { success: true, durationMs: 0 },
		create: async (runtime: ServiceRuntimeClient) => {
			const client = await createRedisServiceToolClient(runtime, 'fixture');
			return lifecycle(client, () => client.ping());
		},
	},
	{
		name: 'Tencent CLS', toolName: 'listTopic', output: { RequestId: 'fixture', TotalCount: 0, Topics: [] },
		create: async (runtime: ServiceRuntimeClient) => {
			const client = await createTencentClsServiceToolClient(runtime, 'fixture');
			return lifecycle(client, () => client.listTopic());
		},
	},
	{
		name: 'Telegram', toolName: 'getMe', output: { ok: true, result: {} },
		create: async (runtime: ServiceRuntimeClient) => {
			const client = await createTelegramServiceToolClient(runtime, 'fixture');
			return lifecycle(client, () => client.getMe());
		},
	},
];

describe.each(cases)('$name remote contract client cleanup', ({ toolName, output, create }) => {
	it.each(['sync throw', 'async reject', 'invalid output'] as const)(
		'finishes close after %s',
		async (failureMode) => {
			await checkCleanup(failureMode, 'close');
		},
		1000,
	);
	it.each(['sync throw', 'async reject', 'invalid output'] as const)(
		'finishes asyncDispose after %s',
		async (failureMode) => {
			await checkCleanup(failureMode, 'dispose');
		},
		1000,
	);

	async function checkCleanup(failureMode: 'sync throw' | 'async reject' | 'invalid output', cleanup: 'close' | 'dispose') {
		const failure = new Error('fixture transport failure');
		// Keep this mock synchronous: an async wrapper would hide the original leak.
		const call = vi.fn<ServiceRuntimeClient['call']>(() => {
			if (failureMode === 'sync throw') throw failure;
			if (failureMode === 'async reject') return Promise.reject(failure);
			return Promise.resolve(null);
		});
		const runtime: ServiceRuntimeClient = {
			getSchema: vi.fn(async () => ({ tools: { [toolName]: { inputSchema: {}, annotations: { readOnlyHint: true } } } })),
			call,
		};
		const client = await create(runtime);
		if (failureMode === 'invalid output') {
			await expect(client.request()).rejects.toThrow(TypeError);
		} else {
			await expect(client.request()).rejects.toBe(failure);
		}
		expect(call).toHaveBeenCalledOnce();
		expect(call).toHaveBeenCalledWith(
			{ params: { service: 'fixture' }, body: { toolName, input: {} } },
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
		// The client remains usable, and successful calls must also release their done.
		call.mockResolvedValue(output);
		await expect(client.request()).resolves.toEqual(output);
		await expect(client[cleanup]()).resolves.toBeUndefined();
		await expect(client[cleanup]()).resolves.toBeUndefined();
		await expect(client.request()).rejects.toThrow('closed');
	}
});
