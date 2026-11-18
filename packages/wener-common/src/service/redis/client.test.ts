import { describe, expect, it, vi } from 'vitest';
import type { ServiceRuntimeClient } from '../runtime/types';
import { createRedisServiceToolClient } from './client';
import { RedisOperations } from './operations';

const RedisTools = Object.fromEntries(Object.entries(RedisOperations).map(([name, operation]) => [name, operation.tool]));

function runtime() {
	return {
		getSchema: vi.fn<ServiceRuntimeClient['getSchema']>(async () => ({ tools: RedisTools })),
		call: vi.fn<ServiceRuntimeClient['call']>(async ({ body }) => {
			switch (body.toolName) {
				case 'ping': return { success: true, durationMs: 0 };
				case 'get': return { durationMs: 0 };
				case 'getType': return { type: 'string', durationMs: 0 };
				case 'getTtl': return { ttlSeconds: -1, durationMs: 0 };
				case 'scan': return { cursor: '0', keys: [], durationMs: 0 };
				case 'getHash': return { data: [], durationMs: 0 };
				case 'rangeStream': return { data: [], durationMs: 0 };
				default: throw new Error('Unexpected fixture tool');
			}
		}),
	};
}
describe('Redis typed remote client', () => {
	it('maps ping options to empty transport input and forwards method inputs', async () => {
		const transport = runtime();
		const signal = new AbortController().signal;
		const client = await createRedisServiceToolClient(transport, 'cache', { signal });
		await client.ping({}, { signal });
		await client.get({ key: 'key' }, { signal });
		await client.getType({ key: 'key' }, { signal });
		await client.getTtl({ key: 'key' }, { signal });
		await client.scan(undefined, { signal });
		await client.getHash({ key: 'key' }, { signal });
		await client.rangeStream({ key: 'events', count: 10 }, { signal });
		expect(transport.getSchema).toHaveBeenCalledExactlyOnceWith({ params: { service: 'cache' } }, { signal });
		expect(transport.call.mock.calls.map(([input]) => input)).toEqual([
			{ params: { service: 'cache' }, body: { toolName: 'ping', input: {} } },
			...['get', 'getType', 'getTtl'].map((toolName) => ({ params: { service: 'cache' }, body: { toolName, input: { key: 'key' } } })),
			{ params: { service: 'cache' }, body: { toolName: 'scan', input: {} } },
			{ params: { service: 'cache' }, body: { toolName: 'getHash', input: { key: 'key' } } },
			{ params: { service: 'cache' }, body: { toolName: 'rangeStream', input: { key: 'events', count: 10 } } },
		]);
		for (const [, options] of transport.call.mock.calls) expect(options?.signal).toBeInstanceOf(AbortSignal);
	});
	it('observes both client and per-call cancellation without invoking transport', async () => {
		const transport = runtime();
		const controller = new AbortController();
		const client = await createRedisServiceToolClient(transport, 'cache', { signal: controller.signal });
		const reason = new Error('cancelled');
		const call = new AbortController();
		call.abort(reason);
		await expect(client.ping({}, { signal: call.signal })).rejects.toBe(reason);
		controller.abort(reason);
		await expect(client.get({ key: 'key' })).rejects.toBe(reason);
		expect(transport.call).not.toHaveBeenCalled();
	});
	it('enforces timeout, abort, and close without waiting for a stuck runtime', async () => {
		const pending: ServiceRuntimeClient = {
			getSchema: vi.fn(async () => ({ tools: { get: RedisOperations.get.tool } })),
			call: vi.fn(async () => new Promise<never>(() => undefined)),
		};
		const client = await createRedisServiceToolClient(pending, 'cache');
		await expect(client.get({ key: 'key' }, { context: { timeoutMs: 5 } })).rejects.toThrow('timed out');
		const controller = new AbortController();
		const request = client.get({ key: 'key' }, { signal: controller.signal });
		controller.abort(new Error('Fixture cancellation'));
		await expect(request).rejects.toThrow('Fixture cancellation');
		const stuck = client.get({ key: 'key' });
		await client.close();
		await expect(stuck).rejects.toThrow('closed');
		await expect(client.close()).resolves.toBeUndefined();
	});

	it('rejects malformed remote outputs before exposing them to callers', async () => {
		const transport = {
			getSchema: vi.fn(async () => ({ tools: { get: RedisOperations.get.tool } })),
			call: vi.fn(async () => ({ value: 42, durationMs: 0 })),
		};
		const client = await createRedisServiceToolClient(transport, 'cache');
		await expect(client.get({ key: 'key' })).rejects.toThrow('Invalid Redis response');
		await client.close();
	});

	it('rejects unavailable remote tools before dispatch', async () => {
		const transport = runtime();
		transport.getSchema.mockResolvedValue({ tools: {} });
		const client = await createRedisServiceToolClient(transport, 'cache');
		await expect(client.ping({})).rejects.toThrow('Redis operation unavailable');
		expect(transport.call).not.toHaveBeenCalled();
	});
});
