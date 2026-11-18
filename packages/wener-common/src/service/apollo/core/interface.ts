import { defineServiceCapability } from '../../registry/ServiceCapability';
import type { ApolloServiceCallOptions, IApolloServiceContract } from '../ApolloServiceContract';
import type { ApolloConnectionConfig, ApolloEndpointRole } from './config';
import type { ApolloReadConfigInput } from './schema';

export type ApolloReadFormat = 'auto' | 'config' | 'json' | 'properties' | 'raw' | 'content' | 'data';

/** Internal HTTP protocol, separate from the public service contract. */
export interface ApolloHttpRequest {
	role: Exclude<ApolloEndpointRole, 'config'>;
	path: string;
	method?: string;
	query?: Record<string, unknown>;
	body?: unknown;
	headers?: Record<string, string>;
	signal?: AbortSignal;
}

export type ApolloConfigReadRequest = ApolloReadConfigInput;

/** Legacy adapter escape hatch: T is a caller cast, not a schema-validated DTO. */
type ApolloLegacyRequest = <T = unknown>(...args: Parameters<IApolloServiceContract['request']>) => Promise<T>;
type ApolloServiceClient = IApolloServiceContract & { request: ApolloLegacyRequest };

export interface IApolloService extends ApolloServiceClient {
	readonly type: 'apollo';
	readonly readOnly: boolean;
	close(): Promise<void>;
}

export interface ApolloAdapter {
	request<T = unknown>(input: ApolloHttpRequest): Promise<T>;
	readConfig<T = unknown>(input?: ApolloConfigReadRequest, options?: Pick<ApolloServiceCallOptions, 'signal'>): Promise<T>;
	close(): Promise<void>;
}

export type ApolloAdapterFactory = (config: ApolloConnectionConfig) => ApolloAdapter;
export const ApolloServiceCapability = defineServiceCapability<IApolloService>('apollo');
