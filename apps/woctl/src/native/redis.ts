import type { ConnectionOptions } from 'node:tls';
import {
	RedisServiceError,
	RedisServiceErrorCodes,
	type RedisAdapter,
	type RedisAdapterFactory,
	type RedisAdapterScanInput,
	type RedisConnectionOptions,
	type RedisFieldValue,
	type RedisStreamEntry,
} from '@wener/common/service/redis';
import Redis, { type RedisOptions } from 'ioredis';

const ResponseLimitError = 'WOCTL_RESPONSE_LIMIT';
const HashScanCount = '1000';
const MaximumHashScanIterations = 10_000;

const BoundedGetScript = `
local value = redis.call('GET', KEYS[1])
if not value then return false end
if string.len(value) > tonumber(ARGV[1]) then return redis.error_reply('${ResponseLimitError}') end
return value
`;

const BoundedScanScript = `
local result
if ARGV[4] == '' then
  result = redis.call('SCAN', ARGV[1], 'MATCH', ARGV[2], 'COUNT', ARGV[3])
else
  result = redis.call('SCAN', ARGV[1], 'MATCH', ARGV[2], 'COUNT', ARGV[3], 'TYPE', ARGV[4])
end
local bytes = string.len(result[1])
for _, value in ipairs(result[2]) do bytes = bytes + string.len(value) end
if bytes > tonumber(ARGV[5]) then return redis.error_reply('${ResponseLimitError}') end
return result
`;

const BoundedHashScanScript = `
local result = redis.call('HSCAN', KEYS[1], ARGV[1], 'COUNT', ARGV[2])
local bytes = string.len(result[1])
for _, value in ipairs(result[2]) do bytes = bytes + string.len(value) end
if bytes > tonumber(ARGV[3]) then return redis.error_reply('${ResponseLimitError}') end
return result
`;

const BoundedStreamRangeScript = `
local result = redis.call('XRANGE', KEYS[1], ARGV[1], ARGV[2], 'COUNT', ARGV[3])
local bytes = 0
for _, entry in ipairs(result) do
  bytes = bytes + string.len(entry[1])
  for _, value in ipairs(entry[2]) do bytes = bytes + string.len(value) end
end
if bytes > tonumber(ARGV[4]) then return redis.error_reply('${ResponseLimitError}') end
return result
`;

interface RedisClientLike {
	readonly status?: string;
	on(event: 'error' | 'ready' | 'end', listener: (error?: unknown) => void): unknown;
	removeListener?(event: 'ready' | 'end', listener: () => void): unknown;
	connect(): Promise<void>;
	ping(): Promise<string>;
	info(section: string): Promise<string>;
	eval(script: string, numberOfKeys: number, ...args: string[]): Promise<unknown>;
	type(key: string): Promise<string>;
	ttl(key: string): Promise<number>;
	disconnect(reconnect?: boolean): void;
}

export function buildIORedisOptions(config: RedisConnectionOptions): RedisOptions {
	const options: RedisOptions = {
		host: config.host,
		port: config.port,
		db: config.databaseIndex,
		username: config.username,
		password: config.password,
		connectTimeout: config.connectTimeoutMs,
		commandTimeout: config.requestTimeoutMs,
		maxRetriesPerRequest: config.maxRetries,
		lazyConnect: true,
		enableOfflineQueue: false,
		autoResendUnfulfilledCommands: false,
	};
	if (config.tls && config.tls.mode !== 'disabled') {
		const tls: ConnectionOptions = {
			rejectUnauthorized: true,
			servername: config.tls.serverName || config.host,
			ca: config.tls.ca,
			cert: config.tls.cert,
			key: config.tls.key,
			passphrase: config.tls.passphrase,
		};
		if (config.tls.mode === 'verify-ca') tls.checkServerIdentity = () => undefined;
		options.tls = tls;
	}
	return options;
}

function arrayValue(value: unknown): unknown[] {
	if (!Array.isArray(value)) {
		throw new RedisServiceError(RedisServiceErrorCodes.OperationFailed, 'Redis adapter response is invalid');
	}
	return value;
}

function stringValue(value: unknown): string {
	if (typeof value !== 'string') {
		throw new RedisServiceError(RedisServiceErrorCodes.OperationFailed, 'Redis adapter response is invalid');
	}
	return value;
}

function stringArray(value: unknown): string[] {
	return arrayValue(value).map(stringValue);
}

function fieldValues(values: readonly string[]): RedisFieldValue[] {
	const result: RedisFieldValue[] = [];
	for (let index = 0; index < values.length; index += 2) {
		result.push({ field: values[index] ?? '', value: values[index + 1] ?? '' });
	}
	return result;
}

function valuesByteLength(values: readonly string[]): number {
	return values.reduce((total, value) => total + Buffer.byteLength(value), 0);
}

export class IORedisAdapter implements RedisAdapter {
	readonly #client: RedisClientLike;
	readonly #maxResponseBytes: number;
	readonly #readyTimeoutMs: number;
	#connectPromise?: Promise<void>;
	#cancelReadyWait?: () => void;
	#closed = false;

	constructor(config: RedisConnectionOptions, client?: RedisClientLike) {
		this.#maxResponseBytes = config.maxResponseBytes;
		this.#readyTimeoutMs = Math.min(config.connectTimeoutMs ?? 10_000, config.requestTimeoutMs ?? Infinity);
		this.#client = client ?? (new Redis(buildIORedisOptions(config)) as RedisClientLike);
		this.#client.on('error', () => {
			// Raw driver errors are intentionally contained at this adapter boundary.
		});
	}

	#waitForReady(): Promise<void> {
		const client = this.#client;
		if (!client.removeListener) {
			return Promise.reject(
				new RedisServiceError(RedisServiceErrorCodes.OperationFailed, 'Redis adapter cannot wait for readiness'),
			);
		}
		return new Promise<void>((resolve, reject) => {
			const finish = (error?: RedisServiceError) => {
				clearTimeout(timeout);
				client.removeListener!('ready', onReady);
				client.removeListener!('end', onEnd);
				if (this.#cancelReadyWait === onClosed) this.#cancelReadyWait = undefined;
				if (error) reject(error);
				else resolve();
			};
			const onReady = () => finish();
			const onEnd = () =>
				finish(new RedisServiceError(RedisServiceErrorCodes.OperationFailed, 'Redis adapter connection ended'));
			const onClosed = () => finish(new RedisServiceError(RedisServiceErrorCodes.Closed, 'Redis adapter is closed'));
			const timeout = setTimeout(
				() => finish(new RedisServiceError(RedisServiceErrorCodes.OperationFailed, 'Redis adapter connection timed out')),
				this.#readyTimeoutMs,
			);
			this.#cancelReadyWait = onClosed;
			client.on('ready', onReady);
			client.on('end', onEnd);
			if (this.#closed) onClosed();
			else if (client.status === 'ready') onReady();
			else if (client.status === 'end') onEnd();
		});
	}

	async #ready(): Promise<void> {
		if (this.#closed) throw new RedisServiceError(RedisServiceErrorCodes.Closed, 'Redis adapter is closed');
		if (this.#client.status === 'ready') return;
		let pending = this.#connectPromise;
		if (!pending) {
			const status = this.#client.status;
			pending = status && ['connecting', 'connect', 'reconnecting', 'close'].includes(status)
				? this.#waitForReady()
				: this.#client.connect();
			this.#connectPromise = pending;
		}
		try {
			await pending;
		} catch (error) {
			if (this.#connectPromise === pending) this.#connectPromise = undefined;
			if (this.#closed) throw new RedisServiceError(RedisServiceErrorCodes.Closed, 'Redis adapter is closed');
			throw error;
		}
		// Status-aware drivers may reconnect again after this successful attempt.
		if (this.#client.status !== undefined && this.#connectPromise === pending) this.#connectPromise = undefined;
		if (this.#closed) throw new RedisServiceError(RedisServiceErrorCodes.Closed, 'Redis adapter is closed');
	}

	async ping(): Promise<string | undefined> {
		await this.#ready();
		await this.#client.ping();
		const info = await this.#client.info('server').catch(() => '');
		return /^valkey_version:([^\r\n]+)/mu.exec(info)?.[1] ?? /^redis_version:([^\r\n]+)/mu.exec(info)?.[1];
	}

	async get(key: string): Promise<string | null> {
		await this.#ready();
		const value = await this.#client.eval(BoundedGetScript, 1, key, String(this.#maxResponseBytes));
		if (value === null || value === undefined) return null;
		return stringValue(value);
	}

	async getType(key: string): Promise<string> {
		await this.#ready();
		return this.#client.type(key);
	}

	async getTtl(key: string): Promise<number> {
		await this.#ready();
		return this.#client.ttl(key);
	}

	async scan(input: RedisAdapterScanInput): Promise<{ cursor: string; keys: string[] }> {
		await this.#ready();
		const result = arrayValue(
			await this.#client.eval(
				BoundedScanScript,
				0,
				input.cursor,
				input.match,
				String(input.count),
				input.type ?? '',
				String(this.#maxResponseBytes),
			),
		);
		return { cursor: stringValue(result[0]), keys: stringArray(result[1]) };
	}

	async getHash(key: string): Promise<RedisFieldValue[]> {
		await this.#ready();
		const values: string[] = [];
		const seen = new Set<string>();
		let cursor = '0';
		let remaining = this.#maxResponseBytes;
		for (let iteration = 0; iteration < MaximumHashScanIterations; iteration++) {
			if (seen.has(cursor)) {
				throw new RedisServiceError(RedisServiceErrorCodes.OperationFailed, 'Redis hash scan cursor loop detected');
			}
			seen.add(cursor);
			const result = arrayValue(
				await this.#client.eval(BoundedHashScanScript, 1, key, cursor, HashScanCount, String(remaining)),
			);
			cursor = stringValue(result[0]);
			const page = stringArray(result[1]);
			remaining -= valuesByteLength([cursor, ...page]);
			if (remaining < 0) {
				throw new RedisServiceError(RedisServiceErrorCodes.OperationFailed, 'Redis service response limit exceeded');
			}
			values.push(...page);
			if (cursor === '0') return fieldValues(values);
		}
		throw new RedisServiceError(RedisServiceErrorCodes.OperationFailed, 'Redis hash scan did not finish');
	}

	async rangeStream(key: string, start: string, end: string, count: number): Promise<RedisStreamEntry[]> {
		await this.#ready();
		const entries = arrayValue(
			await this.#client.eval(
				BoundedStreamRangeScript,
				1,
				key,
				start,
				end,
				String(count),
				String(this.#maxResponseBytes),
			),
		);
		return entries.map((rawEntry) => {
			const entry = arrayValue(rawEntry);
			return { id: stringValue(entry[0]), fields: fieldValues(stringArray(entry[1])) };
		});
	}

	async close(): Promise<void> {
		if (this.#closed) return;
		this.#closed = true;
		this.#cancelReadyWait?.();
		this.#client.disconnect(false);
	}
}

export function createIORedisAdapter(options: RedisConnectionOptions): RedisAdapter {
	return new IORedisAdapter(options);
}

export const createNativeRedisDriver: RedisAdapterFactory = createIORedisAdapter;
