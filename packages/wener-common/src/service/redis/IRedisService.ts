import { defineServiceCapability } from '../registry/ServiceCapability';
import type {
	IRedisServiceContract,
	RedisServiceCallOptions,
	RedisServiceClient,
	RedisServiceInputs,
	RedisServiceOutputs,
} from './RedisServiceContract';

export const RedisServiceType = 'redis' as const;
export type RedisServiceType = typeof RedisServiceType;
export const RedisProducts = Object.freeze(['unspecified', 'redis', 'valkey'] as const);
export type RedisProductName = (typeof RedisProducts)[number];
export const RedisScanTypes = Object.freeze(['string', 'list', 'set', 'zset', 'hash', 'stream'] as const);

export type RedisCallOptions = RedisServiceCallOptions;
export type RedisPingResult = RedisServiceOutputs['ping'];
export type RedisGetInput = RedisServiceInputs['get'];
export type RedisGetResult = RedisServiceOutputs['get'];
export type RedisTypeResult = RedisServiceOutputs['getType'];
export type RedisTtlResult = RedisServiceOutputs['getTtl'];
export type RedisScanInput = NonNullable<RedisServiceInputs['scan']>;
export type RedisScanResult = RedisServiceOutputs['scan'];
export type RedisFieldValue = RedisServiceOutputs['getHash']['data'][number];
export type RedisHashResult = RedisServiceOutputs['getHash'];
export type RedisRangeStreamInput = RedisServiceInputs['rangeStream'];
export type RedisStreamEntry = RedisServiceOutputs['rangeStream']['data'][number];
export type RedisRangeStreamResult = RedisServiceOutputs['rangeStream'];
export type RedisScanType = NonNullable<RedisScanInput['type']>;
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
export interface IRedisService extends AsyncDisposable, IRedisServiceContract {
	readonly type: RedisServiceType;
	readonly product: RedisProductName;
	readonly readOnly: true;
	readonly keyPrefix: string;
	close(): Promise<void>;
}
export type RedisService = IRedisService;
export type { RedisServiceClient };

/** Capability key for `IRedisService`; `registry.load(RedisServiceCapability)` resolves to `IRedisService`. */
export const RedisServiceCapability = defineServiceCapability<IRedisService>('redis');
