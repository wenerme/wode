import { RedisConnectionConfigSchema } from './config';
import { RedisServiceError, RedisServiceErrorCodes, redisOperationError } from './errors';
import type {
	IRedisService, RedisAdapter, RedisAdapterFactory, RedisCallOptions, RedisConnectionOptions,
	RedisFieldValue, RedisGetInput, RedisRangeStreamInput, RedisScanInput, RedisScanType, RedisStreamEntry,
} from './IRedisService';
import { RedisScanTypes } from './IRedisService';

const DefaultCount = 100;
const encoder = new TextEncoder();
const byteLength = (value: string) => encoder.encode(value).byteLength;
export interface CreateRedisServiceOptions { createAdapter: RedisAdapterFactory }
function requiredKey(input: RedisGetInput | undefined): string {
	if (!input || typeof input.key !== 'string')
		throw new RedisServiceError(RedisServiceErrorCodes.InvalidRequest, 'Redis key is invalid');
	return input.key;
}
function boundedCount(value: number | undefined, field: string): number {
	const count = value ?? DefaultCount;
	if (!Number.isSafeInteger(count) || count < 1 || count > 10_000)
		throw new RedisServiceError(RedisServiceErrorCodes.InvalidRequest, `${field} must be between 1 and 10000`);
	return count;
}
function cursorValue(value: string | undefined): string {
	const cursor = value ?? '0';
	if (typeof cursor !== 'string' || !/^\d+$/u.test(cursor))
		throw new RedisServiceError(RedisServiceErrorCodes.InvalidRequest, 'Redis scan cursor is invalid');
	return cursor;
}
function scanType(value: string | undefined): RedisScanType | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== 'string' || !(RedisScanTypes as readonly string[]).includes(value))
		throw new RedisServiceError(RedisServiceErrorCodes.InvalidRequest, 'Redis scan type is invalid');
	return value as RedisScanType;
}
function escapeRedisGlobLiteral(value: string): string { return value.replace(/[\\*?[]/gu, '\\$&'); }
function stringsByteLength(values: readonly string[]): number {
	return values.reduce((total, value) => total + byteLength(value), 0);
}
function fieldValuesByteLength(values: readonly RedisFieldValue[]): number {
	return values.reduce((total, value) => total + byteLength(value.field) + byteLength(value.value), 0);
}
function streamEntriesByteLength(values: readonly RedisStreamEntry[]): number {
	return values.reduce((total, entry) => total + byteLength(entry.id) + fieldValuesByteLength(entry.fields), 0);
}
/** Stop waiting on cancellation while preserving the driver's protocol signature. */
function abortable<T>(operation: Promise<T>, signal?: AbortSignal): Promise<T> {
	if (!signal) return operation;
	return new Promise<T>((resolve, reject) => {
		const aborted = () => reject(signal.reason);
		signal.addEventListener('abort', aborted, { once: true });
		operation.then(
			(value) => { signal.removeEventListener('abort', aborted); resolve(value); },
			(error: unknown) => { signal.removeEventListener('abort', aborted); reject(error); },
		);
		if (signal.aborted) { signal.removeEventListener('abort', aborted); aborted(); }
	});
}
class RedisServiceImpl implements IRedisService {
	readonly type = 'redis' as const;
	readonly product: IRedisService['product'];
	readonly readOnly = true as const;
	readonly keyPrefix: string;
	readonly #adapter: RedisAdapter;
	readonly #maxResponseBytes: number;
	#closed = false;
	#closePromise?: Promise<void>;
	constructor(options: { product: IRedisService['product']; keyPrefix: string; adapter: RedisAdapter; maxResponseBytes: number }) {
		this.product = options.product;
		this.keyPrefix = options.keyPrefix;
		this.#adapter = options.adapter;
		this.#maxResponseBytes = options.maxResponseBytes;
	}
	#assertOpen(): void {
		if (this.#closed) throw new RedisServiceError(RedisServiceErrorCodes.Closed, 'Redis service is closed');
	}
	#key(input: RedisGetInput): string { this.#assertOpen(); return this.keyPrefix + requiredKey(input); }
	#assertResponseSize(bytes: number): void {
		if (bytes > this.#maxResponseBytes)
			throw new RedisServiceError(RedisServiceErrorCodes.OperationFailed, 'Redis service response limit exceeded');
	}
	async #operation<T>(name: string, operation: () => Promise<T>, options?: RedisCallOptions): Promise<{ value: T; durationMs: number }> {
		this.#assertOpen();
		options?.signal?.throwIfAborted();
		const startedAt = Date.now();
		try {
			const value = await abortable(operation(), options?.signal);
			options?.signal?.throwIfAborted();
			return { value, durationMs: Date.now() - startedAt };
		} catch {
			options?.signal?.throwIfAborted();
			throw redisOperationError(name);
		}
	}
	async ping(options?: RedisCallOptions) {
		const result = await this.#operation('ping', () => this.#adapter.ping(), options);
		if (result.value) this.#assertResponseSize(byteLength(result.value));
		return { success: true, durationMs: result.durationMs,
			version: result.value ? `${this.product === 'valkey' ? 'Valkey' : 'Redis'} ${result.value}` : undefined };
	}
	async get(input: RedisGetInput, options?: RedisCallOptions) {
		const key = this.#key(input);
		const result = await this.#operation('get', () => this.#adapter.get(key), options);
		if (result.value !== null) this.#assertResponseSize(byteLength(result.value));
		return { value: result.value ?? undefined, durationMs: result.durationMs };
	}
	async getType(input: RedisGetInput, options?: RedisCallOptions) {
		const key = this.#key(input);
		const result = await this.#operation('get type', () => this.#adapter.getType(key), options);
		this.#assertResponseSize(byteLength(result.value));
		return { type: result.value, durationMs: result.durationMs };
	}
	async getTtl(input: RedisGetInput, options?: RedisCallOptions) {
		const key = this.#key(input);
		const result = await this.#operation('get TTL', () => this.#adapter.getTtl(key), options);
		return { ttlSeconds: result.value, durationMs: result.durationMs };
	}
	async scan(input: RedisScanInput = {}, options?: RedisCallOptions) {
		this.#assertOpen();
		const request = input ?? {};
		const cursor = cursorValue(request.cursor);
		const count = boundedCount(request.count, 'Redis scan count');
		const type = scanType(request.type);
		const userMatch = request.match ?? '*';
		if (typeof userMatch !== 'string')
			throw new RedisServiceError(RedisServiceErrorCodes.InvalidRequest, 'Redis scan match is invalid');
		const match = escapeRedisGlobLiteral(this.keyPrefix) + userMatch;
		const result = await this.#operation('scan', () => this.#adapter.scan({ cursor, match, count, type }), options);
		this.#assertResponseSize(stringsByteLength([result.value.cursor, ...result.value.keys]));
		return { cursor: result.value.cursor,
			keys: result.value.keys.filter((key) => key.startsWith(this.keyPrefix)).map((key) => key.slice(this.keyPrefix.length)),
			durationMs: result.durationMs };
	}
	async getHash(input: RedisGetInput, options?: RedisCallOptions) {
		const key = this.#key(input);
		const result = await this.#operation('get hash', () => this.#adapter.getHash(key), options);
		this.#assertResponseSize(fieldValuesByteLength(result.value));
		return { data: result.value.map(copyFieldValue), durationMs: result.durationMs };
	}
	async rangeStream(input: RedisRangeStreamInput, options?: RedisCallOptions) {
		const key = this.#key(input);
		const count = boundedCount(input.count, 'Redis stream range count');
		const start = input.start ?? '-';
		const end = input.end ?? '+';
		if (typeof start !== 'string' || typeof end !== 'string' || !start || !end)
			throw new RedisServiceError(RedisServiceErrorCodes.InvalidRequest, 'Redis stream range is invalid');
		const result = await this.#operation('range stream', () => this.#adapter.rangeStream(key, start, end, count), options);
		this.#assertResponseSize(streamEntriesByteLength(result.value));
		return { data: result.value.map(copyStreamEntry), durationMs: result.durationMs };
	}
	close(): Promise<void> {
		if (this.#closePromise) return this.#closePromise;
		this.#closed = true;
		this.#closePromise = Promise.resolve().then(() => this.#adapter.close()).then(() => undefined).catch(() => { throw redisOperationError('close'); });
		return this.#closePromise;
	}
}
function copyFieldValue(value: RedisFieldValue): RedisFieldValue { return { field: value.field, value: value.value }; }
function copyStreamEntry(entry: RedisStreamEntry): RedisStreamEntry { return { id: entry.id, fields: entry.fields.map(copyFieldValue) }; }

export async function createRedisService(config: RedisConnectionOptions, options: CreateRedisServiceOptions): Promise<IRedisService> {
	const parsed = RedisConnectionConfigSchema.safeParse(config);
	if (!parsed.success || typeof options?.createAdapter !== 'function')
		throw new RedisServiceError(RedisServiceErrorCodes.InvalidConfig, 'Invalid Redis service configuration');
	let adapter: RedisAdapter;
	try { adapter = await options.createAdapter(parsed.data); }
	catch (error) {
		if (error instanceof RedisServiceError && error.code === RedisServiceErrorCodes.InvalidConfig)
			throw new RedisServiceError(RedisServiceErrorCodes.InvalidConfig, 'Redis driver configuration is invalid');
		throw new RedisServiceError(RedisServiceErrorCodes.OperationFailed, 'Redis service adapter initialization failed');
	}
	return new RedisServiceImpl({ product: parsed.data.product, keyPrefix: parsed.data.keyPrefix, adapter, maxResponseBytes: parsed.data.maxResponseBytes });
}
