import { defineServiceCapability } from '../registry/ServiceCapability';

export const RedisServiceType = 'redis' as const;
export type RedisServiceType = typeof RedisServiceType;
export const RedisProducts = Object.freeze(['unspecified', 'redis', 'valkey'] as const);
export type RedisProductName = (typeof RedisProducts)[number];
export const RedisScanTypes = Object.freeze(['string', 'list', 'set', 'zset', 'hash', 'stream'] as const);
export type RedisScanType = (typeof RedisScanTypes)[number];

export interface RedisCallOptions { signal?: AbortSignal }
export interface RedisPingResult { success: boolean; durationMs: number; version?: string; errorCode?: string }
export interface RedisGetInput { key: string }
export interface RedisGetResult { value?: string; durationMs: number }
export interface RedisTypeResult { type: string; durationMs: number }
export interface RedisTtlResult { ttlSeconds: number; durationMs: number }
export interface RedisScanInput { cursor?: string; match?: string; count?: number; type?: RedisScanType }
export interface RedisScanResult { cursor: string; keys: string[]; durationMs: number }
export interface RedisFieldValue { field: string; value: string }
export interface RedisHashResult { data: RedisFieldValue[]; durationMs: number }
export interface RedisRangeStreamInput { key: string; start?: string; end?: string; count?: number }
export interface RedisStreamEntry { id: string; fields: RedisFieldValue[] }
export interface RedisRangeStreamResult { data: RedisStreamEntry[]; durationMs: number }
export interface RedisAdapterScanInput { cursor: string; match: string; count: number; type?: RedisScanType }

/** Drivers keep the Redis protocol and native I/O outside the shared service. */
export interface RedisAdapter {
	ping(): Promise<string | undefined>;
	get(key: string): Promise<string | null>;
	getType(key: string): Promise<string>;
	getTtl(key: string): Promise<number>;
	scan(input: RedisAdapterScanInput): Promise<{ cursor: string; keys: string[] }>;
	getHash(key: string): Promise<RedisFieldValue[]>;
	rangeStream(key: string, start: string, end: string, count: number): Promise<RedisStreamEntry[]>;
	close(): Promise<void>;
}
export interface RedisTlsOptions {
	mode: 'disabled' | 'verify-ca' | 'verify-full';
	serverName?: string;
	ca?: string;
	cert?: string;
	key?: string;
	passphrase?: string;
	insecureSkipVerify?: false;
}
export interface RedisConnectionOptions {
	product: RedisProductName;
	host: string;
	port: number;
	databaseIndex?: number;
	username?: string;
	password?: string;
	keyPrefix: string;
	tls?: RedisTlsOptions;
	connectTimeoutMs?: number;
	requestTimeoutMs?: number;
	maxRetries?: number;
	maxResponseBytes: number;
}
export type RedisAdapterFactory = (options: RedisConnectionOptions) => RedisAdapter | Promise<RedisAdapter>;
export interface IRedisService extends AsyncDisposable {
	readonly type: RedisServiceType;
	readonly product: RedisProductName;
	readonly readOnly: true;
	readonly keyPrefix: string;
	ping(options?: RedisCallOptions): Promise<RedisPingResult>;
	get(input: RedisGetInput, options?: RedisCallOptions): Promise<RedisGetResult>;
	getType(input: RedisGetInput, options?: RedisCallOptions): Promise<RedisTypeResult>;
	getTtl(input: RedisGetInput, options?: RedisCallOptions): Promise<RedisTtlResult>;
	scan(input?: RedisScanInput, options?: RedisCallOptions): Promise<RedisScanResult>;
	getHash(input: RedisGetInput, options?: RedisCallOptions): Promise<RedisHashResult>;
	rangeStream(input: RedisRangeStreamInput, options?: RedisCallOptions): Promise<RedisRangeStreamResult>;
	close(): Promise<void>;
}
export type RedisService = IRedisService;
export type RedisServiceClient = Pick<IRedisService, 'ping' | 'get' | 'getType' | 'getTtl' | 'scan' | 'getHash' | 'rangeStream'>;

/** Capability key for `IRedisService`; `registry.load(RedisServiceCapability)` resolves to `IRedisService`. */
export const RedisServiceCapability = defineServiceCapability<IRedisService>('redis');
