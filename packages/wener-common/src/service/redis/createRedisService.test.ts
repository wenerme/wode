import { describe, expect, it, vi } from 'vitest';
import { fakeRedisAdapter } from './adapter.fixture';
import { RedisConnectionConfigSchema } from './config';
import { createRedisService } from './createRedisService';
import { RedisServiceError, RedisServiceErrorCodes } from './errors';
import type { RedisConnectionOptions } from './IRedisService';

function baseConfig() {
	return RedisConnectionConfigSchema.parse({
		product: 'valkey', host: 'cache.example.test', port: 6379, username: 'app', password: 'fixture-password',
		connectTimeoutMs: 1500, requestTimeoutMs: 2500, databaseIndex: 2, keyPrefix: 'tenant:', maxRetries: 3, maxResponseBytes: 1024,
	});
}
describe('createRedisService', () => {
	it('creates a read-only service from materialized connection config', async () => {
		const connections: RedisConnectionOptions[] = [];
		const service = await createRedisService(baseConfig(), { createAdapter: (connection) => { connections.push(connection); return fakeRedisAdapter(); } });
		expect(service).toMatchObject({ type: 'redis', product: 'valkey', readOnly: true, keyPrefix: 'tenant:' });
		expect(connections).toEqual([expect.objectContaining(baseConfig())]);
	});
	it('applies keyPrefix to every key operation and preserves field/value data', async () => {
		const adapter = fakeRedisAdapter();
		const service = await createRedisService(baseConfig(), { createAdapter: () => adapter });
		await expect(service.get({ key: 'user:1' })).resolves.toMatchObject({ value: 'value' });
		await service.getType({ key: 'user:1' });
		await service.getTtl({ key: 'user:1' });
		await expect(service.getHash({ key: 'user:1' })).resolves.toMatchObject({ data: [{ field: 'name', value: 'alice' }] });
		await expect(service.rangeStream({ key: 'events', count: 10 })).resolves.toMatchObject({ data: [{ id: '1-0', fields: [{ field: 'event', value: 'created' }] }] });
		expect(adapter.get).toHaveBeenCalledWith('tenant:user:1');
		expect(adapter.getType).toHaveBeenCalledWith('tenant:user:1');
		expect(adapter.getTtl).toHaveBeenCalledWith('tenant:user:1');
		expect(adapter.getHash).toHaveBeenCalledWith('tenant:user:1');
		expect(adapter.rangeStream).toHaveBeenCalledWith('tenant:events', '-', '+', 10);
	});
	it('constrains SCAN to an escaped prefix, filters foreign keys, and strips the prefix', async () => {
		const adapter = fakeRedisAdapter();
		vi.mocked(adapter.scan).mockResolvedValueOnce({ cursor: '17', keys: ['tenant:[1]*:user:a', 'other:user:b', 'tenant:[1]*:user:c'] });
		const service = await createRedisService({ ...baseConfig(), keyPrefix: 'tenant:[1]*:' }, { createAdapter: () => adapter });
		await expect(service.scan({ cursor: '0', match: 'user:*', count: 25, type: 'hash' })).resolves.toMatchObject({ cursor: '17', keys: ['user:a', 'user:c'] });
		expect(adapter.scan).toHaveBeenCalledWith({ cursor: '0', match: 'tenant:\\[1]\\*:user:*', count: 25, type: 'hash' });
	});
	it('passes materialized TLS credentials through to the driver', async () => {
		const createAdapter = vi.fn(() => fakeRedisAdapter());
		const tls = { mode: 'verify-full' as const, serverName: 'cache.example.test', ca: 'fixture-ca', cert: 'fixture-cert', key: 'fixture-key', passphrase: 'fixture-passphrase' };
		await createRedisService({ ...baseConfig(), tls }, { createAdapter });
		expect(createAdapter).toHaveBeenCalledWith(expect.objectContaining({ tls }));
	});
	it('returns product-aware versions and rejects oversized adapter responses', async () => {
		const adapter = fakeRedisAdapter();
		vi.mocked(adapter.ping).mockResolvedValueOnce('9.0.0');
		vi.mocked(adapter.get).mockResolvedValueOnce('123456');
		const service = await createRedisService({ ...baseConfig(), maxResponseBytes: 5 }, { createAdapter: () => adapter });
		await expect(service.ping()).resolves.toMatchObject({ version: 'Valkey 9.0.0' });
		await expect(service.get({ key: 'large' })).rejects.toMatchObject({ code: RedisServiceErrorCodes.OperationFailed, message: 'Redis service response limit exceeded' });
	});
	it.each(['ping', 'get', 'getType', 'scan', 'getHash', 'rangeStream'] as const)('bounds UTF-8 response bytes for %s', async (operation) => {
		const adapter = fakeRedisAdapter();
		vi.mocked(adapter.ping).mockResolvedValue('éé');
		vi.mocked(adapter.get).mockResolvedValue('éé');
		vi.mocked(adapter.getType).mockResolvedValue('éé');
		vi.mocked(adapter.scan).mockResolvedValue({ cursor: '0', keys: ['éé'] });
		vi.mocked(adapter.getHash).mockResolvedValue([{ field: 'é', value: 'é' }]);
		vi.mocked(adapter.rangeStream).mockResolvedValue([{ id: '1', fields: [{ field: 'é', value: 'é' }] }]);
		const service = await createRedisService({ ...baseConfig(), maxResponseBytes: 3 }, { createAdapter: () => adapter });
		await expect(operation === 'ping' ? service.ping() : operation === 'scan' ? service.scan() : service[operation]({ key: 'key' })).rejects.toThrow('response limit exceeded');
	});
	it('sanitizes adapter initialization and operation errors', async () => {
		await expect(createRedisService(baseConfig(), { createAdapter: () => { throw new RedisServiceError(RedisServiceErrorCodes.InvalidConfig, 'redis://user:fixture-secret@cache.example.test'); } })).rejects.toMatchObject({ code: RedisServiceErrorCodes.InvalidConfig, message: 'Redis driver configuration is invalid' });
		await expect(createRedisService(baseConfig(), { createAdapter: () => { throw new Error('fixture-secret'); } })).rejects.toMatchObject({ message: 'Redis service adapter initialization failed' });
		const adapter = fakeRedisAdapter();
		vi.mocked(adapter.get).mockRejectedValueOnce(new Error('WRONGTYPE password=fixture-secret'));
		const service = await createRedisService(baseConfig(), { createAdapter: () => adapter });
		const error = await service.get({ key: 'key' }).catch((value: unknown) => value);
		expect(error).toMatchObject({ code: RedisServiceErrorCodes.OperationFailed, message: 'Redis service get failed' });
		expect(String(error)).not.toContain('fixture-secret');
		expect(error).not.toHaveProperty('cause');
	});
	it('closes once and rejects every operation after close', async () => {
		const adapter = fakeRedisAdapter();
		const service = await createRedisService(baseConfig(), { createAdapter: () => adapter });
		const first = service.close();
		expect(service.close()).toBe(first);
		await first;
		expect(adapter.close).toHaveBeenCalledTimes(1);
		for (const operation of [() => service.ping(), () => service.get({ key: 'x' }), () => service.getType({ key: 'x' }), () => service.getTtl({ key: 'x' }), () => service.scan(), () => service.getHash({ key: 'x' }), () => service.rangeStream({ key: 'x' })])
			await expect(operation()).rejects.toMatchObject({ code: RedisServiceErrorCodes.Closed });
	});
	it('sanitizes close failure, including synchronous driver failure, and never retries', async () => {
		const adapter = fakeRedisAdapter();
		vi.mocked(adapter.close).mockImplementation(() => { throw new Error('fixture-secret'); });
		const service = await createRedisService(baseConfig(), { createAdapter: () => adapter });
		const first = service.close();
		await expect(first).rejects.toThrow('Redis service close failed');
		expect(service.close()).toBe(first);
		expect(adapter.close).toHaveBeenCalledTimes(1);
	});
	it.each([
		{ input: { cursor: '-1' }, method: 'scan' }, { input: { cursor: '1.5' }, method: 'scan' },
		{ input: { cursor: 1 }, method: 'scan' }, { input: { match: {} }, method: 'scan' },
		{ input: { count: 0 }, method: 'scan' }, { input: { count: 10_001 }, method: 'scan' },
		{ input: { type: 'module' }, method: 'scan' }, { input: { key: 'events', count: 0 }, method: 'rangeStream' },
		{ input: { key: 'events', count: 10_001 }, method: 'rangeStream' }, { input: { key: 'events', start: 1 }, method: 'rangeStream' },
	])('rejects invalid bounded request $method %#', async ({ input, method }) => {
		const adapter = fakeRedisAdapter();
		const service = await createRedisService(baseConfig(), { createAdapter: () => adapter });
		await expect(method === 'scan' ? service.scan(input as never) : service.rangeStream(input as never)).rejects.toMatchObject({ code: RedisServiceErrorCodes.InvalidRequest });
		expect(adapter.scan).not.toHaveBeenCalled();
		expect(adapter.rangeStream).not.toHaveBeenCalled();
	});
	it('observes cancellation before dispatch and after a driver result without wrapping the reason', async () => {
		const adapter = fakeRedisAdapter();
		const service = await createRedisService(baseConfig(), { createAdapter: () => adapter });
		const controller = new AbortController();
		const reason = new Error('cancelled');
		controller.abort(reason);
		await expect(service.get({ key: 'x' }, { signal: controller.signal })).rejects.toBe(reason);
		expect(adapter.get).not.toHaveBeenCalled();
		const next = new AbortController();
		vi.mocked(adapter.get).mockImplementationOnce(async () => { next.abort(reason); return 'value'; });
		await expect(service.get({ key: 'x' }, { signal: next.signal })).rejects.toBe(reason);
	});
	it('requires explicit factory injection and validates config before creating a driver', async () => {
		await expect(createRedisService(baseConfig(), undefined as never)).rejects.toMatchObject({ code: RedisServiceErrorCodes.InvalidConfig });
		const createAdapter = vi.fn(() => fakeRedisAdapter());
		await expect(createRedisService({ ...baseConfig(), port: 0 }, { createAdapter })).rejects.toMatchObject({ code: RedisServiceErrorCodes.InvalidConfig });
		expect(createAdapter).not.toHaveBeenCalled();
	});
	it('stops waiting on an in-flight command when cancelled and consumes late driver rejection', async () => {
		const adapter = fakeRedisAdapter();
		let fail: (reason: unknown) => void = () => {};
		vi.mocked(adapter.get).mockImplementationOnce(() => new Promise<string | null>((_resolve, reject) => { fail = reject; }));
		const service = await createRedisService(baseConfig(), { createAdapter: () => adapter });
		const controller = new AbortController();
		const pending = service.get({ key: 'x' }, { signal: controller.signal });
		const reason = new Error('cancelled');
		controller.abort(reason);
		await expect(pending).rejects.toBe(reason);
		fail(new Error('late fixture-secret'));
		await service.close();
	});
});
