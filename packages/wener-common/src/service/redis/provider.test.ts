import { describe, expect, it, vi } from 'vitest';
import { ServiceRegistry } from '../registry';
import { fakeRedisAdapter } from './adapter.fixture';
import { resolveRedisConnectionOptions } from './config';
import { RedisServiceProvider } from './index';

describe('Redis configuration and typed provider', () => {
	it('materializes redis URLs, percent-encoded credentials, database and option overrides', () => {
		expect(resolveRedisConnectionOptions({ baseUrl: 'redis://app:p%40ss@cache.example.test:6380/2', options: { keyPrefix: 'tenant:', databaseIndex: 3 } })).toMatchObject({
			host: 'cache.example.test', port: 6380, username: 'app', password: 'p@ss', databaseIndex: 3, keyPrefix: 'tenant:',
		});
		expect(resolveRedisConnectionOptions({ options: { host: 'cache.example.test' } })).toMatchObject({ host: 'cache.example.test', port: 6379, product: 'unspecified', maxResponseBytes: 16 * 1024 * 1024 });
		expect(resolveRedisConnectionOptions({ baseUrl: 'redis://[::1]:6380/0' }).host).toBe('::1');
	});
	it('enables certificate and hostname verification for rediss and retains explicit TLS settings', () => {
		expect(resolveRedisConnectionOptions({ baseUrl: 'rediss://cache.example.test' }).tls).toEqual({ mode: 'verify-full' });
		expect(resolveRedisConnectionOptions({ baseUrl: 'rediss://cache.example.test', options: { tls: { mode: 'verify-ca', ca: 'fixture-ca' } } }).tls).toEqual({ mode: 'verify-ca', ca: 'fixture-ca' });
	});
	it.each([
		{}, { baseUrl: 'https://cache.example.test' }, { baseUrl: 'redis://cache.example.test/invalid' },
		{ baseUrl: 'redis://cache.example.test?password=fixture-secret' }, { baseUrl: 'redis://cache.example.test#fixture-secret' },
		{ baseUrl: 'rediss://cache.example.test', options: { tls: { mode: 'disabled' } } },
		{ options: { host: 'cache.example.test', tls: { cert: 'incomplete' } } },
		{ options: { host: 'cache.example.test', tls: { mode: 'disabled', ca: 'fixture-ca' } } },
		{ options: { host: 'cache.example.test', tls: { insecureSkipVerify: true } } },
		{ options: { host: 'cache.example.test', maxResponseBytes: 64 * 1024 * 1024 + 1 } },
		{ options: { host: 'cache.example.test', command: 'SET' } },
		{ baseUrl: 'redis://cache.example.test', readOnly: false },
	])('rejects invalid configuration without exposing its values %#', (config) => {
		expect(() => resolveRedisConnectionOptions(config as never)).toThrow('Invalid Redis service configuration');
	});
	it('discovers the valkey alias and defers env references until capability loading', async () => {
		const redisDriver = vi.fn(() => fakeRedisAdapter());
		const getEnv = vi.fn((name: string) => name === 'REDIS_TEST_PASSWORD' ? 'fixture-password' : name === 'REDIS_TEST_URL' ? 'rediss://cache.example.test/2' : undefined);
		const registry = new ServiceRegistry({ redisDriver, getEnv, context: { services: { cache: { provider: 'valkey', readOnly: true, baseUrl: 'env://REDIS_TEST_URL', options: { product: 'valkey', password: 'env://REDIS_TEST_PASSWORD', keyPrefix: 'tenant:' } } } } });
		registry.register(RedisServiceProvider);
		expect(registry.list('redis')).toEqual([{ name: 'cache', provider: 'redis', provides: ['redis'], readOnly: true }]);
		expect(getEnv).not.toHaveBeenCalled();
		expect(redisDriver).not.toHaveBeenCalled();
		await registry.load('redis', 'cache');
		expect(redisDriver).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ host: 'cache.example.test', port: 6379, password: 'fixture-password', databaseIndex: 2, product: 'valkey', keyPrefix: 'tenant:', tls: { mode: 'verify-full' } }));
		await registry.close();
	});
	it('refuses readOnly false and unavailable drivers', async () => {
		const redisDriver = vi.fn(() => fakeRedisAdapter());
		for (const readOnly of [false, true]) {
			const registry = new ServiceRegistry({ redisDriver: readOnly ? undefined : redisDriver, context: { services: { cache: { provider: 'redis', readOnly, baseUrl: 'redis://cache.example.test' } } } });
			registry.register(RedisServiceProvider);
			await expect(registry.load('redis')).rejects.toThrow('Failed to create service');
			await registry.close();
		}
		expect(redisDriver).not.toHaveBeenCalled();
	});
	it('reports fixed provider admission errors before invoking the factory', async () => {
		const context = { name: 'cache', config: { provider: 'redis', readOnly: false }, context: { services: {} }, fetch: globalThis.fetch };
		await expect(RedisServiceProvider.create(context)).rejects.toThrow('Redis service must be read-only');
		await expect(RedisServiceProvider.create({ ...context, config: { ...context.config, readOnly: true } })).rejects.toThrow('Redis driver is unavailable');
	});
});
