import { spawn, spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ConnectionOptions } from 'node:tls';
import type { RedisAdapter, RedisConnectionOptions } from '@wener/common/service/redis';
import Redis from 'ioredis';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildIORedisOptions, createIORedisAdapter, createNativeRedisDriver, IORedisAdapter } from './redis';

function connection(): RedisConnectionOptions {
	return {
		product: 'redis',
		host: 'redis.example.com',
		port: 6379,
		keyPrefix: '',
		maxResponseBytes: 1024,
	};
}

function fakeClient() {
	return {
		on: vi.fn(),
		connect: vi.fn(async (): Promise<void> => undefined),
		ping: vi.fn(async () => 'PONG'),
		info: vi.fn(async () => 'redis_version:7.2.4\r\nvalkey_version:9.0.1\r\n'),
		eval: vi.fn(async (..._args: [string, number, ...string[]]) => null as unknown),
		type: vi.fn(async () => 'string'),
		ttl: vi.fn(async () => -1),
		disconnect: vi.fn(),
	};
}

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((resolvePromise) => {
		resolve = resolvePromise;
	});
	return { promise, resolve };
}

function statefulClient(status = 'reconnecting') {
	const events = new EventEmitter();
	const client = {
		...fakeClient(),
		status,
		on: vi.fn((event: string, listener: (...args: unknown[]) => void) => events.on(event, listener)),
		removeListener: vi.fn((event: string, listener: () => void) => events.removeListener(event, listener)),
	};
	return { client, events };
}

describe('IORedisAdapter', () => {
	it('uses an automatically recovered ready connection after the first connect fails', async () => {
		const { client } = statefulClient('wait');
		client.connect.mockImplementationOnce(async () => {
			client.status = 'reconnecting';
			throw new Error('connection refused');
		});
		const adapter = new IORedisAdapter(connection(), client);
		await expect(adapter.ping()).rejects.toThrow('connection refused');
		client.status = 'ready';
		await expect(adapter.ping()).resolves.toBe('9.0.1');
		expect(client.connect).toHaveBeenCalledTimes(1);
		await adapter.close();
		await expect(adapter.ping()).rejects.toMatchObject({ code: 'CLOSED' });
	});

	it('shares readiness waits without calling connect during automatic reconnection', async () => {
		const { client, events } = statefulClient();
		const adapter = new IORedisAdapter(connection(), client);
		const pending = Promise.all([adapter.getType('key'), adapter.getTtl('key')]);
		expect(events.listenerCount('ready')).toBe(1);
		expect(events.listenerCount('end')).toBe(1);
		client.status = 'ready';
		events.emit('ready');
		await expect(pending).resolves.toEqual(['string', -1]);
		expect(events.listenerCount('ready')).toBe(0);
		expect(events.listenerCount('end')).toBe(0);
		// A previous successful wait must not bypass the next reconnection.
		client.status = 'reconnecting';
		const again = adapter.ping();
		expect(events.listenerCount('ready')).toBe(1);
		client.status = 'ready';
		events.emit('ready');
		await expect(again).resolves.toBe('9.0.1');
		expect(client.connect).not.toHaveBeenCalled();
		await adapter.close();
	});

	it.each([
		{ connectTimeoutMs: 25, requestTimeoutMs: 100 },
		{ connectTimeoutMs: 100, requestTimeoutMs: 25 },
	])('bounds readiness waiting and cleans listeners with %j', async (timeouts) => {
		vi.useFakeTimers();
		const { client, events } = statefulClient();
		const adapter = new IORedisAdapter({ ...connection(), ...timeouts }, client);
		try {
			const failure = expect(adapter.ping()).rejects.toThrow('connection timed out');
			await vi.advanceTimersByTimeAsync(25);
			await failure;
			expect(events.listenerCount('ready')).toBe(0);
			expect(events.listenerCount('end')).toBe(0);
			expect(vi.getTimerCount()).toBe(0);
			expect(client.connect).not.toHaveBeenCalled();
			client.status = 'ready';
			await expect(adapter.ping()).resolves.toBe('9.0.1');
		} finally {
			await adapter.close();
			vi.useRealTimers();
		}
	});

	it('cancels shared readiness waits and removes listeners and timers on close', async () => {
		vi.useFakeTimers();
		const { client, events } = statefulClient();
		const adapter = new IORedisAdapter(connection(), client);
		try {
			const first = expect(adapter.ping()).rejects.toMatchObject({ code: 'CLOSED' });
			const second = expect(adapter.get('key')).rejects.toMatchObject({ code: 'CLOSED' });
			expect(events.listenerCount('ready')).toBe(1);
			await adapter.close();
			await Promise.all([first, second]);
			expect(events.listenerCount('ready')).toBe(0);
			expect(events.listenerCount('end')).toBe(0);
			expect(vi.getTimerCount()).toBe(0);
			expect(client.disconnect).toHaveBeenCalledWith(false);
			expect(client.ping).not.toHaveBeenCalled();
			expect(client.eval).not.toHaveBeenCalled();
		} finally {
			await adapter.close();
			vi.useRealTimers();
		}
	});

	it('cleans readiness listeners when reconnection ends without becoming ready', async () => {
		const { client, events } = statefulClient('connecting');
		const adapter = new IORedisAdapter(connection(), client);
		const failure = expect(adapter.ping()).rejects.toThrow('connection ended');
		client.status = 'end';
		events.emit('end');
		await failure;
		expect(events.listenerCount('ready')).toBe(0);
		expect(events.listenerCount('end')).toBe(0);
		await adapter.close();
	});

	it('retries connect after the first connection attempt rejects', async () => {
		const client = fakeClient();
		client.connect.mockRejectedValueOnce(new Error('connection refused')).mockResolvedValueOnce(undefined);
		const adapter = new IORedisAdapter(connection(), client);

		await expect(adapter.ping()).rejects.toThrow('connection refused');
		await expect(adapter.ping()).resolves.toBe('9.0.1');
		expect(client.connect).toHaveBeenCalledTimes(2);
		await adapter.close();
		expect(client.disconnect).toHaveBeenCalledWith(false);
	});

	it('does not continue an operation when close wins a pending connect race', async () => {
		const client = fakeClient();
		const connecting = deferred();
		client.connect.mockReturnValueOnce(connecting.promise);
		const adapter = new IORedisAdapter(connection(), client);

		const ping = adapter.ping();
		await Promise.resolve();
		await adapter.close();
		connecting.resolve();
		await expect(ping).rejects.toMatchObject({ code: 'CLOSED' });
		expect(client.ping).not.toHaveBeenCalled();
		expect(client.info).not.toHaveBeenCalled();
	});

	it('uses bounded server-side scripts for values and collection pages', async () => {
		const client = fakeClient();
		client.eval
			.mockResolvedValueOnce('value')
			.mockResolvedValueOnce(['0', ['tenant:a']])
			.mockResolvedValueOnce(['7', ['name', 'sample']])
			.mockResolvedValueOnce(['0', ['kind', 'typed']])
			.mockResolvedValueOnce([['1-0', ['event', 'created']]]);
		const adapter = new IORedisAdapter(connection(), client);

		await expect(adapter.get('key')).resolves.toBe('value');
		await expect(adapter.scan({ cursor: '0', match: 'tenant:*', count: 10, type: 'hash' })).resolves.toEqual({
			cursor: '0',
			keys: ['tenant:a'],
		});
		await expect(adapter.getHash('hash')).resolves.toEqual([
			{ field: 'name', value: 'sample' },
			{ field: 'kind', value: 'typed' },
		]);
		await expect(adapter.rangeStream('events', '-', '+', 5)).resolves.toEqual([
			{ id: '1-0', fields: [{ field: 'event', value: 'created' }] },
		]);

		expect(client.eval.mock.calls[0]?.slice(1)).toEqual([1, 'key', '1024']);
		expect(client.eval.mock.calls[1]?.slice(1)).toEqual([0, '0', 'tenant:*', '10', 'hash', '1024']);
		expect(client.eval.mock.calls[2]?.slice(1)).toEqual([1, 'hash', '0', '1000', '1024']);
		expect(client.eval.mock.calls[3]?.slice(1)).toEqual([1, 'hash', '7', '1000', '1013']);
		expect(client.eval.mock.calls[4]?.slice(1)).toEqual([1, 'events', '-', '+', '5', '1024']);
		await adapter.close();
	});

	it('shares an in-flight connect and closes idempotently', async () => {
		const client = fakeClient();
		const connecting = deferred();
		client.connect.mockReturnValueOnce(connecting.promise);
		const adapter = new IORedisAdapter(connection(), client);
		const pending = Promise.all([adapter.getType('key'), adapter.getTtl('key')]);
		expect(client.connect).toHaveBeenCalledTimes(1);
		connecting.resolve();
		await expect(pending).resolves.toEqual(['string', -1]);
		await adapter.close();
		await adapter.close();
		await expect(adapter.get('key')).rejects.toMatchObject({ code: 'CLOSED' });
		expect(client.disconnect).toHaveBeenCalledTimes(1);
	});

	it('contains error events and tolerates unavailable server info', async () => {
		const client = fakeClient();
		client.info.mockRejectedValueOnce(new Error('server info unavailable'));
		const adapter = new IORedisAdapter(connection(), client);
		const listener = client.on.mock.calls[0] as unknown as ['error', (error: Error) => void];
		expect(listener[0]).toBe('error');
		expect(() => listener[1](new Error('raw driver detail'))).not.toThrow();
		await expect(adapter.ping()).resolves.toBeUndefined();
		await adapter.close();
	});

	it('deducts UTF-8 bytes across hash pages and rejects cumulative overflow', async () => {
		const client = fakeClient();
		client.eval.mockResolvedValueOnce(['7', ['a', '界']]).mockResolvedValueOnce(['0', ['b', '界']]);
		const adapter = new IORedisAdapter({ ...connection(), maxResponseBytes: 9 }, client);
		await expect(adapter.getHash('hash')).rejects.toThrow('response limit exceeded');
		expect(client.eval.mock.calls[1]?.slice(1)).toEqual([1, 'hash', '7', '1000', '4']);
		await adapter.close();
	});

	it('rejects repeated hash cursors', async () => {
		const client = fakeClient();
		client.eval.mockResolvedValue(['7', []]);
		const adapter = new IORedisAdapter(connection(), client);
		await expect(adapter.getHash('hash')).rejects.toThrow('cursor loop detected');
		expect(client.eval).toHaveBeenCalledTimes(2);
		await adapter.close();
	});

	it('stops a hash scan that never terminates', async () => {
		const client = fakeClient();
		let cursor = 0;
		client.eval.mockImplementation(async () => [String(++cursor), []]);
		const adapter = new IORedisAdapter({ ...connection(), maxResponseBytes: 100_000 }, client);
		await expect(adapter.getHash('hash')).rejects.toThrow('did not finish');
		expect(client.eval).toHaveBeenCalledTimes(10_000);
		await adapter.close();
	});

	it('rejects malformed driver responses with a stable service error', async () => {
		const client = fakeClient();
		client.eval.mockResolvedValueOnce(42).mockResolvedValueOnce(['0', [42]]);
		const adapter = new IORedisAdapter(connection(), client);
		await expect(adapter.get('key')).rejects.toMatchObject({ code: 'OPERATION_FAILED' });
		await expect(adapter.scan({ cursor: '0', match: '*', count: 10 })).rejects.toMatchObject({
			code: 'OPERATION_FAILED',
		});
		await adapter.close();
	});
});

describe('native Redis options and factory', () => {
	it('preserves lazy connection, authentication, timeouts and retry settings', async () => {
		const options = buildIORedisOptions({
			...connection(),
			databaseIndex: 3,
			username: 'sample-user',
			password: 'sample-password',
			connectTimeoutMs: 500,
			requestTimeoutMs: 750,
			maxRetries: 0,
		});
		expect(options).toMatchObject({
			db: 3,
			username: 'sample-user',
			password: 'sample-password',
			connectTimeout: 500,
			commandTimeout: 750,
			maxRetriesPerRequest: 0,
			lazyConnect: true,
			enableOfflineQueue: false,
			autoResendUnfulfilledCommands: false,
		});
		expect(options.tls).toBeUndefined();
		expect(createNativeRedisDriver).toBe(createIORedisAdapter);
		const adapter = await createNativeRedisDriver(connection());
		await adapter.close();
		await expect(adapter.ping()).rejects.toMatchObject({ code: 'CLOSED' });
	});

	it('keeps certificate validation enabled for verify-ca and hostname validation for verify-full', () => {
		const ca = buildIORedisOptions({ ...connection(), tls: { mode: 'verify-ca' } }).tls as ConnectionOptions;
		expect(ca.rejectUnauthorized).toBe(true);
		expect(ca.servername).toBe('redis.example.com');
		expect(ca.checkServerIdentity?.('other.example.com', {} as never)).toBeUndefined();
		const full = buildIORedisOptions({
			...connection(),
			tls: { mode: 'verify-full', serverName: 'secure.example.com', ca: 'sample-ca', cert: 'sample-cert', key: 'sample-key' },
		}).tls;
		expect(full).toMatchObject({ rejectUnauthorized: true, servername: 'secure.example.com', ca: 'sample-ca' });
		expect((full as ConnectionOptions).checkServerIdentity).toBeUndefined();
		expect(buildIORedisOptions({ ...connection(), tls: { mode: 'disabled' } }).tls).toBeUndefined();
	});
});

async function startSocketServer(directory: string, socket: string) {
	const server = spawn('redis-server', [
		'--port', '0', '--unixsocket', socket, '--unixsocketperm', '700',
		'--save', '', '--appendonly', 'no', '--dir', directory,
	], { stdio: ['ignore', 'pipe', 'pipe'] });
	const exited = new Promise<void>((resolve) => {
		server.once('exit', () => resolve());
		server.once('error', () => resolve());
	});
	const stop = async () => {
		server.kill('SIGTERM');
		await exited;
	};
	try {
		await new Promise<void>((resolve, reject) => {
			let output = '';
			const timeout = setTimeout(() => finish(new Error('Redis fixture startup timed out')), 5000);
			const onData = (chunk: Buffer) => {
				output += chunk.toString();
				if (output.toLowerCase().includes('ready to accept connections')) finish();
			};
			const onExit = () => finish(new Error('Redis fixture exited'));
			const finish = (error?: Error) => {
				clearTimeout(timeout);
				server.stdout!.removeListener('data', onData);
				server.removeListener('error', finish);
				server.removeListener('exit', onExit);
				if (error) reject(error);
				else resolve();
			};
			server.stdout!.on('data', onData);
			server.once('error', finish);
			server.once('exit', onExit);
		});
		return stop;
	} catch (error) {
		await stop();
		throw error;
	}
}

describe.skipIf(spawnSync('redis-server', ['--version']).status !== 0)('native Redis automatic reconnection', () => {
	it('recovers the same adapter after an absent socket appears using the default retry strategy', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'woctl-redis-'));
		const socket = join(directory, 'redis.sock');
		const options = { ...connection(), connectTimeoutMs: 2000, requestTimeoutMs: 3000 };
		const client = new Redis(socket, buildIORedisOptions(options));
		const connect = vi.spyOn(client, 'connect');
		const native = new IORedisAdapter(options, client);
		let stopServer: (() => Promise<void>) | undefined;
		let writer: Redis | undefined;
		try {
			await expect(native.get('recovery:value')).rejects.toThrow();
			await expect.poll(() => client.status).toBe('reconnecting');
			const recovered = expect(native.ping()).resolves.toMatch(/^\d+\.\d+/u);
			stopServer = await startSocketServer(directory, socket);
			writer = new Redis(socket, { lazyConnect: true });
			writer.on('error', () => {});
			await writer.connect();
			await writer.set('recovery:value', 'recovered');
			await recovered;
			expect(client.status).toBe('ready');
			const attempts = connect.mock.calls.length;
			await expect(native.get('recovery:value')).resolves.toBe('recovered');
			await expect(native.ping()).resolves.toMatch(/^\d+\.\d+/u);
			expect(connect).toHaveBeenCalledTimes(attempts);
			expect(client.listenerCount('end')).toBe(0);
		} finally {
			await native.close();
			writer?.disconnect(false);
			await stopServer?.();
			await rm(directory, { recursive: true, force: true });
		}
	});

	it('closes a real default reconnect loop and removes its readiness wait listeners', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'woctl-redis-'));
		const options = { ...connection(), connectTimeoutMs: 2000 };
		const client = new Redis(join(directory, 'missing.sock'), buildIORedisOptions(options));
		const connect = vi.spyOn(client, 'connect');
		const native = new IORedisAdapter(options, client);
		try {
			await expect(native.ping()).rejects.toThrow();
			await expect.poll(() => client.status).toBe('reconnecting');
			const readyListeners = client.listenerCount('ready');
			const endListeners = client.listenerCount('end');
			const closed = expect(native.get('key')).rejects.toMatchObject({ code: 'CLOSED' });
			expect(client.listenerCount('ready')).toBe(readyListeners + 1);
			expect(client.listenerCount('end')).toBe(endListeners + 1);
			await native.close();
			await closed;
			expect(client.listenerCount('ready')).toBe(readyListeners);
			expect(client.listenerCount('end')).toBe(endListeners);
			const attempts = connect.mock.calls.length;
			// ioredis may retain the reconnecting status after cancelling its retry timer.
			await new Promise<void>((resolve) => setTimeout(resolve, 150));
			expect(connect).toHaveBeenCalledTimes(attempts);
			await expect(native.ping()).rejects.toMatchObject({ code: 'CLOSED' });
		} finally {
			await native.close();
			await rm(directory, { recursive: true, force: true });
		}
	});
});

// This fixture only opens its own Unix socket; it cannot contact an existing Redis instance.
describe.skipIf(spawnSync('redis-server', ['--version']).status !== 0)('native Redis isolated fixture', () => {
	let directory: string;
	let socket: string;
	let stopServer: (() => Promise<void>) | undefined;
	let writer: Redis | undefined;
	const adapters: RedisAdapter[] = [];

	async function cleanup() {
		await Promise.all(adapters.map((adapter) => adapter.close()));
		writer?.disconnect(false);
		await stopServer?.();
		if (directory) await rm(directory, { recursive: true, force: true });
	}

	beforeAll(async () => {
		directory = await mkdtemp(join(tmpdir(), 'woctl-redis-'));
		socket = join(directory, 'redis.sock');
		try {
			stopServer = await startSocketServer(directory, socket);
			writer = new Redis(socket, { lazyConnect: true, retryStrategy: () => null });
			writer.on('error', () => {});
			await writer.connect();
			await writer.set('fixture:value', 'hello');
			await writer.set('fixture:large', '界'.repeat(400));
			await writer.hset('fixture:hash', 'name', 'sample', 'kind', 'typed');
			await writer.xadd('fixture:stream', '1-0', 'event', 'created');
			await writer.hset('fixture:large-hash', 'field', 'x'.repeat(1500));
			await writer.xadd('fixture:large-stream', '1-0', 'field', 'x'.repeat(1500));
			await writer.set(`fixture:${'x'.repeat(1100)}`, 'value');
		} catch (error) {
			await cleanup();
			throw error;
		}
	});

	afterAll(cleanup);

	function adapter(maxResponseBytes = 1024) {
		const options = { ...connection(), maxResponseBytes };
		const client = new Redis(socket, { ...buildIORedisOptions(options), retryStrategy: () => null });
		const result = new IORedisAdapter(options, client);
		adapters.push(result);
		return result;
	}

	it('reads values, metadata, hash fields, typed scan and stream entries', async () => {
		const native = adapter();
		await expect(native.ping()).resolves.toMatch(/^\d+\.\d+/u);
		await expect(native.get('fixture:value')).resolves.toBe('hello');
		await expect(native.get('fixture:missing')).resolves.toBeNull();
		await expect(native.getType('fixture:hash')).resolves.toBe('hash');
		await expect(native.getTtl('fixture:value')).resolves.toBe(-1);
		await expect(native.getHash('fixture:hash')).resolves.toEqual(expect.arrayContaining([
			{ field: 'name', value: 'sample' }, { field: 'kind', value: 'typed' },
		]));
		await expect(native.scan({ cursor: '0', match: 'fixture:hash', count: 100, type: 'hash' })).resolves.toEqual({
			cursor: '0', keys: ['fixture:hash'],
		});
		await expect(native.rangeStream('fixture:stream', '-', '+', 1)).resolves.toEqual([
			{ id: '1-0', fields: [{ field: 'event', value: 'created' }] },
		]);
		await native.close();
		await expect(native.get('fixture:value')).rejects.toMatchObject({ code: 'CLOSED' });
	});

	it('enforces server-side response limits for all four bounded commands', async () => {
		const native = adapter();
		await expect(native.get('fixture:large')).rejects.toThrow('WOCTL_RESPONSE_LIMIT');
		await expect(native.scan({ cursor: '0', match: 'fixture:*', count: 100 })).rejects.toThrow('WOCTL_RESPONSE_LIMIT');
		await expect(native.getHash('fixture:large-hash')).rejects.toThrow('WOCTL_RESPONSE_LIMIT');
		await expect(native.rangeStream('fixture:large-stream', '-', '+', 1)).rejects.toThrow('WOCTL_RESPONSE_LIMIT');
		await expect(writer!.get('fixture:value')).resolves.toBe('hello');
	});
});
