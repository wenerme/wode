import type { RedisAdapter, RedisConnectionOptions } from '@wener/common/service/redis';
import { createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { createWebCli } from './web';

function fixture() {
	const getEnv = vi.fn((name: string) => name === 'REDIS_TEST_PASSWORD' ? 'fixture-password' : undefined);
	const connections: RedisConnectionOptions[] = [];
	const adapters: RedisAdapter[] = [];
	const redisDriver = vi.fn((connection: RedisConnectionOptions): RedisAdapter => {
		connections.push(connection);
		const adapter: RedisAdapter = {
			ping: vi.fn(async () => '8.0.0'), get: vi.fn(async (key) => key.endsWith('missing') ? null : 'hello'),
			getType: vi.fn(async () => 'string'), getTtl: vi.fn(async () => -1),
			scan: vi.fn(async ({ cursor }) => cursor === '0' ? { cursor: '7', keys: ['tenant:user:1', 'other:key'] } : { cursor: '0', keys: ['tenant:user:2'] }),
			getHash: vi.fn(async () => [{ field: 'name', value: 'alice' }]),
			rangeStream: vi.fn(async () => [{ id: '1-0', fields: [{ field: 'event', value: 'created' }] }]),
			close: vi.fn(async () => undefined),
		};
		adapters.push(adapter);
		return adapter;
	});
	const config = createMemoryCliConfigStore({ services: [{ name: 'cache', type: 'valkey', baseUrl: 'rediss://cache.example.test/2', options: { product: 'valkey', password: 'env://REDIS_TEST_PASSWORD', keyPrefix: 'tenant:' } }], defaults: { redis: 'cache' } });
	const cli = createWebCli({ config, getEnv, redisDriver });
	const lines: string[] = [];
	const io = { signal: new AbortController().signal, stdout: (line: string) => lines.push(line) };
	return { cli, config, getEnv, redisDriver, connections, adapters, lines, io };
}
describe('Redis end-to-end command adapters', () => {
	it('discovers Redis and its alias without resolving credentials or creating a driver', async () => {
		const f = fixture();
		expect((await f.cli.describe()).some((command) => command.name === 'redis')).toBe(true);
		await f.cli.executeLine('redis --list-services --json', f.io);
		expect(JSON.parse(f.lines.at(-1)!)).toEqual([{ name: 'cache', provider: 'redis', readOnly: true, default: true }]);
		await f.cli.executeLine('valkey scan --help', f.io);
		expect(f.lines.join('\n')).toContain('--all');
		expect(f.getEnv).not.toHaveBeenCalled();
		expect(f.redisDriver).not.toHaveBeenCalled();
	});
	it.each(['ping', 'info'])('executes %s through the no-input wrapper and closes the driver', async (command) => {
		const f = fixture();
		await f.cli.executeLine(`redis ${command} --json`, f.io);
		expect(JSON.parse(f.lines.at(-1)!)).toMatchObject({ success: true, version: 'Valkey 8.0.0' });
		expect(f.connections).toEqual([expect.objectContaining({ host: 'cache.example.test', port: 6379, databaseIndex: 2, password: 'fixture-password', keyPrefix: 'tenant:', tls: { mode: 'verify-full' } })]);
		expect(f.adapters[0].ping).toHaveBeenCalledExactlyOnceWith();
		expect(f.adapters[0].close).toHaveBeenCalledTimes(1);
	});
	it.each([
		['get', 'get', { value: 'hello' }], ['type', 'getType', { type: 'string' }], ['ttl', 'getTtl', { ttlSeconds: -1 }],
		['hgetall', 'getHash', { data: [{ field: 'name', value: 'alice' }] }],
	] as const)('executes %s through the selected typed service', async (command, method, expected) => {
		const f = fixture();
		await f.cli.executeLine(`valkey ${command} user:1 --json`, f.io);
		expect(JSON.parse(f.lines.at(-1)!)).toMatchObject(expected);
		expect(f.adapters[0][method]).toHaveBeenCalledExactlyOnceWith('tenant:user:1');
		expect(f.adapters[0].close).toHaveBeenCalledTimes(1);
	});
	it('preserves missing GET and stream bounds', async () => {
		const f = fixture();
		await f.cli.executeLine('redis get missing --json', f.io);
		expect(JSON.parse(f.lines.at(-1)!)).toMatchObject({ key: 'missing' });
		expect(JSON.parse(f.lines.at(-1)!)).not.toHaveProperty('value');
		await f.cli.executeLine('redis xrange events --start 1-0 --end + --count 2 --json', f.io);
		expect(f.adapters[1].rangeStream).toHaveBeenCalledExactlyOnceWith('tenant:events', '1-0', '+', 2);
		expect(JSON.parse(f.lines.at(-1)!)).toMatchObject({ data: [{ id: '1-0', fields: [{ field: 'event', value: 'created' }] }] });
	});
	it('keeps single-page SCAN and all-page SCAN distinct while isolating prefixes', async () => {
		const f = fixture();
		await f.cli.executeLine('redis scan --match user:* --count 2 --type hash --json', f.io);
		expect(JSON.parse(f.lines.at(-1)!)).toMatchObject({ cursor: '7', keys: ['user:1'] });
		expect(f.adapters[0].scan).toHaveBeenCalledExactlyOnceWith({ cursor: '0', match: 'tenant:user:*', count: 2, type: 'hash' });
		await f.cli.executeLine('redis scan --all --json', f.io);
		expect(JSON.parse(f.lines.at(-1)!)).toMatchObject({ cursor: '0', keys: ['user:1', 'user:2'], pages: [{ cursor: '7', keys: ['user:1'] }, { cursor: '0', keys: ['user:2'] }] });
		expect(f.adapters[1].scan).toHaveBeenCalledTimes(2);
	});
	it.each([
		['get'], ['get', 'one', 'two'], ['scan', '--count', '0'], ['scan', '--count', '10001'],
		['scan', '--cursor', '-1'], ['scan', '--type', 'invalid'], ['xrange', 'events', '--count', '0'],
		['set', 'key', 'value'], ['del', 'key'],
	])('rejects invalid or unsupported argv %j before credentials and driver creation', async (...argv) => {
		const f = fixture();
		await expect(f.cli.execute(['redis', ...argv], f.io)).rejects.toThrow();
		expect(f.getEnv).not.toHaveBeenCalled();
		expect(f.redisDriver).not.toHaveBeenCalled();
	});
	it('refuses readOnly false and sanitizes driver initialization errors', async () => {
		const f = fixture();
		const config = await f.config.load();
		config.services!.cache.readOnly = false;
		await f.config.save(config);
		await expect(f.cli.executeLine('redis get key --json', f.io)).rejects.toThrow('Failed to create service');
		expect(f.redisDriver).not.toHaveBeenCalled();
		config.services!.cache.readOnly = true;
		await f.config.save(config);
		f.redisDriver.mockImplementationOnce(() => { throw new Error('redis://app:fixture-password@cache.example.test'); });
		await expect(f.cli.executeLine('redis get key --json', f.io)).rejects.toThrow('Failed to create service');
		expect(f.lines.join('\n')).not.toContain('fixture-password');
	});
	it('reports scan loops and closes the driver on failure', async () => {
		const f = fixture();
		const createDriver = f.redisDriver.getMockImplementation()!;
		f.redisDriver.mockImplementation((connection) => {
			const adapter = createDriver(connection);
			vi.mocked(adapter.scan).mockResolvedValue({ cursor: '7', keys: [] });
			return adapter;
		});
		await expect(f.cli.executeLine('redis scan --all --json', f.io)).rejects.toThrow('SCAN cursor loop detected');
		expect(f.adapters[0].scan).toHaveBeenCalledTimes(2);
		expect(f.adapters[0].close).toHaveBeenCalledTimes(1);
	});
});
