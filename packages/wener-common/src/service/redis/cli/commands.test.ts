import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliOptions } from '../../cli/ServiceCliDefinition';
import { RedisTools } from '../../runtime/redis-tools';
import { RedisServiceContract } from '../RedisServiceContract';
import type { RedisServiceClient } from '../interface';
import { RedisCliDefinition } from './commands';
import { redisCliQueryResult } from './output';
import { RedisCliPingError } from './RedisCliPingError';
import { RedisScanLimits } from './scan';

function client() {
	return {
		ping: vi.fn<RedisServiceClient['ping']>(async () => ({ success: true, durationMs: 1, version: '7' })),
		get: vi.fn<RedisServiceClient['get']>(async () => ({ value: 'hello', durationMs: 2 })),
		getType: vi.fn<RedisServiceClient['getType']>(async () => ({ type: 'string', durationMs: 3 })),
		getTtl: vi.fn<RedisServiceClient['getTtl']>(async () => ({ ttlSeconds: -1, durationMs: 4 })),
		scan: vi.fn<RedisServiceClient['scan']>(async () => ({ cursor: '0', keys: [], durationMs: 5 })),
		getHash: vi.fn<RedisServiceClient['getHash']>(async () => ({ data: [{ field: 'f', value: 'v' }], durationMs: 6 })),
		rangeStream: vi.fn<RedisServiceClient['rangeStream']>(async () => ({ data: [{ id: '1-0', fields: [{ field: 'f', value: 'v' }] }], durationMs: 7 })),
	};
}
function operation(name: string) {
	const result = RedisCliDefinition.commands.find((entry) => entry.name === name);
	if (!result) throw new Error(`Missing operation ${name}`);
	return result;
}
async function prepare(name: string, args: string[] = [], options: ServiceCliOptions = {}) {
	return operation(name).prepare({ args, options, readText: async () => { throw new Error('Unexpected read'); } });
}
describe('Redis shared CLI definition', () => {
	it('uses the exact seven provider Tool names and schemas for its browser contract', () => {
		expect(Object.keys(RedisServiceContract.methods)).toEqual(['ping', 'get', 'getType', 'getTtl', 'scan', 'getHash', 'rangeStream']);
		expect(Object.keys(RedisServiceContract.methods)).toEqual(Object.keys(RedisTools));
		for (const [key, method] of Object.entries(RedisServiceContract.methods)) {
			expect(method.inputSchema).toBe(RedisTools[key].inputSchema);
			expect(method.outputSchema).toBe(RedisTools[key].outputSchema);
			expect(RedisTools[key].annotations).toEqual({ readOnlyHint: true, destructiveHint: false });
		}
		expect(operation('info').aliases).toEqual(['ping']);
	});
	it('calls ping with only call options', async () => {
		const service = client();
		const signal = new AbortController().signal;
		await (await prepare('info'))(service, { signal });
		expect(service.ping).toHaveBeenCalledExactlyOnceWith({ signal });
	});
	it.each([
		['get', 'get', ['session:1', 'hello']], ['type', 'getType', ['session:1', 'string']],
		['ttl', 'getTtl', ['session:1', -1]], ['hgetall', 'getHash', ['f', 'v']],
	] as const)('%s consumes canonical key args and forwards the abort signal', async (name, method, row) => {
		const service = client();
		const signal = new AbortController().signal;
		const result = await (await prepare(name, ['session:1']))(service, { signal });
		expect(service[method]).toHaveBeenCalledWith({ key: 'session:1' }, { signal });
		expect(operation(name).table?.(result).rows).toEqual([row]);
	});
	it('preserves missing GET, negative TTL, empty hash and empty stream projections', async () => {
		const service = client();
		service.get.mockResolvedValue({ durationMs: 0 });
		service.getHash.mockResolvedValue({ durationMs: 0, data: [] });
		service.rangeStream.mockResolvedValue({ durationMs: 0, data: [] });
		const get = await (await prepare('get', ['missing']))(service, {});
		expect(redisCliQueryResult('get', get).rows).toEqual([{ key: 'missing', value: null }]);
		for (const name of ['hgetall', 'xrange']) expect(operation(name).table?.(await (await prepare(name, ['missing']))(service, {})).rows).toEqual([]);
	});
	it('normalizes xrange defaults and retains stream table fields', async () => {
		const service = client();
		const result = await (await prepare('xrange', ['events']))(service, {});
		expect(service.rangeStream).toHaveBeenCalledWith({ key: 'events', start: '-', end: '+', count: 50 }, {});
		expect(operation('xrange').table?.(result)).toEqual({ headers: ['id', 'field', 'value'], rows: [['1-0', 'f', 'v']] });
	});
	it('throws a fixed, secret-free ping failure for browser hosts', async () => {
		const service = client();
		service.ping.mockResolvedValue({ success: false, durationMs: 1, errorCode: 'UPSTREAM-SECRET' });
		await expect((await prepare('info'))(service, {})).rejects.toSatisfy((error: unknown) => error instanceof RedisCliPingError && error.message === 'Redis ping failed' && error.cause === undefined && !JSON.stringify(error).includes('UPSTREAM-SECRET'));
	});
	it('rejects extra args and invalid bounded inputs before client execution', async () => {
		await expect(prepare('get', ['cache', 'key'])).rejects.toThrow('Exactly one key');
		await expect(prepare('scan', ['cache'])).rejects.toThrow('Unexpected Redis positional');
		await expect(prepare('get', [''])).rejects.toThrow('Invalid key');
		for (const count of ['0', '10001', '1.5', 'NaN', '']) {
			await expect(prepare('scan', [], { count })).rejects.toThrow('--count must be an integer between 1 and 10000');
			await expect(prepare('xrange', ['key'], { count })).rejects.toThrow('--count must be an integer between 1 and 10000');
		}
		await expect(prepare('scan', [], { type: 'INVALID' })).rejects.toThrow('Invalid type');
		await expect(prepare('scan', [], { cursor: '-1' })).rejects.toThrow('Invalid cursor');
		await expect(prepare('scan', [], { all: 'true' })).rejects.toThrow('--all must be a boolean');
	});
	it('defaults to one SCAN and preserves the empty-page cursor', async () => {
		const service = client();
		service.scan.mockResolvedValue({ cursor: '7', keys: [], durationMs: 1 });
		const result = await (await prepare('scan'))(service, {});
		expect(service.scan).toHaveBeenCalledExactlyOnceWith({ cursor: '0', count: 100 }, {});
		expect(redisCliQueryResult('scan', result)).toEqual({ columns: ['cursor', 'key'], rows: [{ cursor: '7', key: null }], durationMs: 1 });
	});
	it('follows cursors, keeps per-page projection and sums durations while dropping empty pages', async () => {
		const service = client();
		service.scan.mockResolvedValueOnce({ cursor: '7', keys: ['a'], durationMs: 1 }).mockResolvedValueOnce({ cursor: '3', keys: [], durationMs: 2 }).mockResolvedValueOnce({ cursor: '0', keys: ['b'], durationMs: 3 });
		const signal = new AbortController().signal;
		const result = await (await prepare('scan', [], { all: true, match: 'user:*', count: '2', type: 'hash' }))(service, { signal });
		expect(service.scan.mock.calls.map(([input]) => input?.cursor)).toEqual(['0', '7', '3']);
		expect(service.scan).toHaveBeenLastCalledWith({ cursor: '3', match: 'user:*', count: 2, type: 'hash' }, { signal });
		expect(result).toMatchObject({ cursor: '0', keys: ['a', 'b'], durationMs: 6 });
		expect(redisCliQueryResult('scan', result).rows).toEqual([{ cursor: '7', key: 'a' }, { cursor: '0', key: 'b' }]);
	});
	it('rejects a repeated cursor before issuing a duplicate request', async () => {
		const service = client();
		service.scan.mockResolvedValue({ cursor: '7', keys: [], durationMs: 1 });
		await expect((await prepare('scan', [], { all: true }))(service, {})).rejects.toThrow('SCAN cursor loop detected at cursor 7');
		expect(service.scan).toHaveBeenCalledTimes(2);
	});
	it('accepts exactly the key budget and rejects cumulative excess without extra requests', async () => {
		const service = client();
		service.scan.mockResolvedValue({ cursor: '0', keys: Array(RedisScanLimits.keys).fill('k'), durationMs: 1 });
		const execute = await prepare('scan', [], { all: true });
		await expect(execute(service, {})).resolves.toMatchObject({ cursor: '0' });
		service.scan.mockClear();
		service.scan.mockResolvedValueOnce({ cursor: '1', keys: Array(RedisScanLimits.keys).fill('k'), durationMs: 1 });
		service.scan.mockResolvedValueOnce({ cursor: '0', keys: ['extra'], durationMs: 1 });
		await expect(execute(service, {})).rejects.toThrow('SCAN exceeded 100000 keys');
		expect(service.scan).toHaveBeenCalledTimes(2);
	});
	it('accepts exactly 64 MiB UTF-8 bytes and rejects cumulative excess', async () => {
		const service = client();
		const oneMiB = 'é'.repeat(512 * 1024);
		const execute = await prepare('scan', [], { all: true });
		service.scan.mockResolvedValueOnce({ cursor: '0', keys: Array(64).fill(oneMiB), durationMs: 1 });
		await expect(execute(service, {})).resolves.toMatchObject({ cursor: '0' });
		service.scan.mockClear();
		service.scan.mockResolvedValueOnce({ cursor: '1', keys: Array(64).fill(oneMiB), durationMs: 1 });
		service.scan.mockResolvedValueOnce({ cursor: '0', keys: ['é'], durationMs: 1 });
		await expect(execute(service, {})).rejects.toThrow('SCAN exceeded 67108864 bytes');
		expect(service.scan).toHaveBeenCalledTimes(2);
	});
	it('stops after exactly 10000 rounds when unique cursors never terminate', async () => {
		const service = client();
		service.scan.mockImplementation(async (input) => ({ cursor: String(Number(input?.cursor) + 1), keys: [], durationMs: 0 }));
		await expect((await prepare('scan', [], { all: true }))(service, {})).rejects.toThrow('SCAN did not finish after 10000 iterations');
		expect(service.scan).toHaveBeenCalledTimes(10_000);
	});
	it('accepts completion on exactly the final permitted SCAN round', async () => {
		const service = client();
		service.scan.mockImplementation(async (input) => ({ cursor: Number(input?.cursor) === RedisScanLimits.iterations - 1 ? '0' : String(Number(input?.cursor) + 1), keys: [], durationMs: 0 }));
		await expect((await prepare('scan', [], { all: true }))(service, {})).resolves.toMatchObject({ cursor: '0' });
		expect(service.scan).toHaveBeenCalledTimes(RedisScanLimits.iterations);
	});
	it('checks cancellation before the first scan and between pages', async () => {
		const service = client();
		const controller = new AbortController();
		controller.abort(new Error('cancelled'));
		const execute = await prepare('scan', [], { all: true });
		await expect(execute(service, { signal: controller.signal })).rejects.toThrow('cancelled');
		expect(service.scan).not.toHaveBeenCalled();
		const next = new AbortController();
		service.scan.mockImplementationOnce(async () => { next.abort(new Error('cancelled')); return { cursor: '1', keys: [], durationMs: 0 }; });
		await expect(execute(service, { signal: next.signal })).rejects.toThrow('cancelled');
		expect(service.scan).toHaveBeenCalledTimes(1);
	});
});
