import { describe, expect, it, vi } from 'vitest';
import { RedisServiceProvider } from '../providers/redis';
import { ServiceRegistry, type ServiceProviderDefinition } from '../registry';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { RedisTools } from '../runtime/redis-tools';
import type { IRedisService } from './interface';
import { RedisOperations } from './operations';

describe('Redis registered operations', () => {
	it('covers all existing methods and preserves typed arguments, options and zero-input ping', async () => {
		const service: IRedisService = {
			type: 'redis', product: 'redis', readOnly: true, keyPrefix: '',
			ping: vi.fn(async () => ({ success: true, durationMs: 0 })),
			get: vi.fn(async () => ({ value: 'value', durationMs: 0 })),
			getType: vi.fn(async () => ({ type: 'string', durationMs: 0 })),
			getTtl: vi.fn(async () => ({ ttlSeconds: 1, durationMs: 0 })),
			scan: vi.fn(async () => ({ cursor: '0', keys: [], durationMs: 0 })),
			getHash: vi.fn(async () => ({ data: [], durationMs: 0 })),
			rangeStream: vi.fn(async () => ({ data: [], durationMs: 0 })), close: vi.fn(async () => {}),
		};
		const definition: ServiceProviderDefinition<'redis'> = { ...RedisServiceProvider, create: () => ({ redis: service }) };
		const registry = new ServiceRegistry({ context: { services: { cache: { provider: 'redis', readOnly: true } } } });
		registry.register(definition);
		const options = { signal: new AbortController().signal };
		await RedisOperations.ping.execute(registry, 'cache', {}, options);
		expect(service.ping).toHaveBeenCalledExactlyOnceWith(options);
		for (const test of [
			{ operation: RedisOperations.get, input: { key: 'example' }, invoke: service.get },
			{ operation: RedisOperations.getType, input: { key: 'example' }, invoke: service.getType },
			{ operation: RedisOperations.getTtl, input: { key: 'example' }, invoke: service.getTtl },
			{ operation: RedisOperations.scan, input: { cursor: '0', match: 'example:*', count: 3, type: 'string' }, invoke: service.scan },
			{ operation: RedisOperations.getHash, input: { key: 'hash' }, invoke: service.getHash },
			{ operation: RedisOperations.rangeStream, input: { key: 'stream', start: '-', end: '+', count: 3 }, invoke: service.rangeStream },
		]) {
			await test.operation.execute(registry, 'cache', test.input, options);
			expect(test.invoke).toHaveBeenCalledExactlyOnceWith(test.input, options);
		}
		expect(createServiceProviderAdapter(definition).tools).toEqual(RedisTools);
		expect(Object.keys(RedisOperations)).toEqual(Object.keys(RedisTools));
		await registry.close();
		expect(service.close).toHaveBeenCalledTimes(1);
	});

	it.each(['unknown', 'input', 'cancelled'])('rejects %s before env or Redis driver creation', async (kind) => {
		const config = { provider: 'redis', readOnly: true, baseUrl: 'env://REDIS_TEST_URL' };
		const getEnv = vi.fn(() => 'redis://cache.example.test');
		const redisDriver = vi.fn((): never => { throw new Error('must not create'); });
		const client = await createServiceProviderAdapter(RedisServiceProvider).create({
			name: 'cache', config, context: { services: { cache: config } }, fetch: globalThis.fetch, getEnv, redisDriver,
		});
		const controller = new AbortController();
		if (kind === 'cancelled') controller.abort();
		await expect(client.call(kind === 'unknown' ? 'missing' : 'get', kind === 'input' ? { key: '' } : { key: 'example' }, { signal: controller.signal })).rejects.toThrow();
		expect(getEnv).not.toHaveBeenCalled();
		expect(redisDriver).not.toHaveBeenCalled();
		await client.close?.();
	});
});
