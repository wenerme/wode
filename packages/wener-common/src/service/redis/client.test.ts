import { describe, expect, it, vi } from 'vitest';
import { RedisTools } from '../runtime/redis-tools';
import type { ServiceRuntimeClient } from '../runtime/types';
import { createRedisServiceToolClient } from './client';

function runtime() {
	return {
		getSchema: vi.fn<ServiceRuntimeClient['getSchema']>(async () => ({ tools: RedisTools })),
		call: vi.fn<ServiceRuntimeClient['call']>(async () => ({ success: true, durationMs: 0 })),
	};
}
describe('Redis typed remote client', () => {
	it('maps ping options to empty transport input and forwards method inputs', async () => {
		const transport = runtime();
		const signal = new AbortController().signal;
		const client = await createRedisServiceToolClient(transport, 'cache', { signal });
		await client.ping({ signal });
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
		await expect(client.ping({ signal: call.signal })).rejects.toBe(reason);
		controller.abort(reason);
		await expect(client.get({ key: 'key' })).rejects.toBe(reason);
		expect(transport.call).not.toHaveBeenCalled();
	});
	it('rejects unavailable remote tools', async () => {
		const transport = runtime();
		transport.getSchema.mockResolvedValue({ tools: {} });
		const client = await createRedisServiceToolClient(transport, 'cache');
		expect(() => client.ping()).toThrow('Service operation unavailable');
		expect(transport.call).not.toHaveBeenCalled();
	});
});
