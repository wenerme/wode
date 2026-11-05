import {
	OpenObserveClient,
	type OpenObserveClientOptions,
	type OpenObserveGetStreamSchemaInput,
	type OpenObserveListStreamInput,
	type OpenObserveListStreamResult,
	type OpenObserveListTraceInput,
	type OpenObserveListTraceResult,
	type OpenObserveSearchInput,
	type OpenObserveSearchResult,
	type OpenObserveStatus,
	type OpenObserveStreamSchemaResult,
} from '@wener/client/openobserve';
import { z } from 'zod';
import type { ServiceProviderDefinition } from '../registry';
import type { ServiceProviderContext } from '../runtime/types';
import type { IOpenObserveService } from './IOpenObserveService';
import { OpenObserveOperations } from './operations';
import { OpenObserveServiceCapability } from './IOpenObserveService';
export { sanitizeOpenObserveOutput } from './sanitize';

export type { IOpenObserveService, OpenObserveService } from './IOpenObserveService';
export { OpenObserveServiceCapability } from './IOpenObserveService';
export type {
	OpenObserveClientOptions,
	OpenObserveGetStreamSchemaInput,
	OpenObserveListStreamInput,
	OpenObserveListStreamResult,
	OpenObserveListTraceInput,
	OpenObserveListTraceResult,
	OpenObserveSearchInput,
	OpenObserveSearchResult,
	OpenObserveStatus,
	OpenObserveStreamSchemaResult,
};

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);
export const OpenObserveServiceOptionsSchema = Object.assign(z.strictObject({
	organization: z.string().min(1).max(255).optional(),
	accessToken: z.string().min(1).optional(),
	accessTokenEnv: envName.optional(),
	username: z.string().min(1).optional(),
	usernameEnv: envName.optional(),
	password: z.string().optional(),
	passwordEnv: envName.optional(),
	timeoutMs: z.number().int().min(1).max(3_600_000).optional(),
	maxResponseBytes: z
		.number()
		.int()
		.min(1)
		.max(64 * 1024 * 1024)
		.optional(),
}), {
	jsonSchema: {
		type: 'object',
		properties: {
			organization: { type: 'string' }, accessToken: { type: 'string' }, accessTokenEnv: { type: 'string' },
			username: { type: 'string' }, usernameEnv: { type: 'string' }, password: { type: 'string' }, passwordEnv: { type: 'string' },
			timeoutMs: { type: 'integer', minimum: 1 }, maxResponseBytes: { type: 'integer', minimum: 1 },
		},
		additionalProperties: false,
	},
});
const configOptions = OpenObserveServiceOptionsSchema;
function options({ config, getEnv }: ServiceProviderContext): OpenObserveClientOptions {
	if (!config.baseUrl) throw new Error('OpenObserve service requires baseUrl');
	const parsed = configOptions.safeParse(config.options ?? {});
	if (!parsed.success) throw new Error('Invalid OpenObserve service configuration');
	const value = parsed.data;
	function credential(name: 'accessToken' | 'username' | 'password'): string | undefined {
		const reference = value[`${name}Env`];
		if (value[name] !== undefined && reference !== undefined)
			throw new Error('Conflicting OpenObserve credential configuration');
		if (reference === undefined) return value[name];
		const secret = getEnv?.(reference);
		if (secret === undefined || !secret.length)
			throw new Error('OpenObserve credential environment variable is unavailable');
		return secret;
	}
	return {
		baseUrl: config.baseUrl,
		organization: value.organization,
		accessToken: credential('accessToken'),
		username: credential('username'),
		password: credential('password'),
		timeoutMs: value.timeoutMs,
		maxResponseBytes: value.maxResponseBytes,
		headers: config.headers,
	};
}

export const OpenObserveServiceProvider: ServiceProviderDefinition<IOpenObserveService> = {
	name: 'openobserve',
	aliases: ['oo'],
	provides: [OpenObserveServiceCapability],
	optionsSchema: OpenObserveServiceOptionsSchema,
	operations: OpenObserveOperations,
	create(context) {
		const client = new OpenObserveClient({ ...options(context), fetch: context.fetch });
		const writable = () => {
			if (context.config.readOnly !== false) throw new Error('Selected service is read-only');
		};
		const service: IOpenObserveService = {
			type: 'openobserve', readOnly: context.config.readOnly !== false,
			health: (callOptions) => client.health(callOptions),
			status: (input, callOptions) => client.status(input, callOptions),
			listStreams: (input, callOptions) => client.listStreams(input, callOptions),
			getStreamSchema: (input, callOptions) => client.getStreamSchema(input, callOptions),
			search: (input, callOptions) => client.search(input, callOptions),
			listTraces: (input, callOptions) => client.listTraces(input, callOptions),
			getStreamSettings: (input, callOptions) => client.getStreamSettings(input, callOptions),
			getValues: (input, callOptions) => client.getValues(input, callOptions),
			searchAround: (input, callOptions) => client.searchAround(input, callOptions),
			async updateStreamSettings(input, callOptions) { writable(); return client.updateStreamSettings(input, callOptions); },
			async deleteStream(input, callOptions) { writable(); return client.deleteStream(input, callOptions); },
			async ingestJson(input, callOptions) { writable(); return client.ingestJson(input, callOptions); },
			async ingestMulti(input, callOptions) { writable(); return client.ingestMulti(input, callOptions); },
			close: () => client.close(),
			[Symbol.asyncDispose]() {
				return this.close();
			},
		};
		return { openobserve: service };
	},
};
