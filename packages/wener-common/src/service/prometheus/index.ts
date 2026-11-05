import {
	PrometheusClient,
	type PrometheusClientOptions,
	type PrometheusLabelsInput,
	type PrometheusLabelValuesInput,
	type PrometheusMetadataInput,
	type PrometheusMetadataResponse,
	type PrometheusLabelValuesResponse,
	type PrometheusQueryInput,
	type PrometheusQueryRangeInput,
	type PrometheusQueryResponse,
	type PrometheusSeriesInput,
	type PrometheusSeriesResponse,
} from '@wener/client/prometheus';
import { z } from 'zod';
import type { ServiceProviderDefinition } from '../registry';
import type { ServiceProviderContext } from '../runtime/types';
import { PrometheusOperations } from './operations';

export { sanitizePrometheusOutput } from './sanitize';
export type {
	PrometheusClientOptions,
	PrometheusLabelsInput,
	PrometheusLabelValuesInput,
	PrometheusMetadataInput,
	PrometheusMetadataResponse,
	PrometheusLabelValuesResponse,
	PrometheusQueryInput,
	PrometheusQueryRangeInput,
	PrometheusQueryResponse,
	PrometheusSeriesInput,
	PrometheusSeriesResponse,
} from '@wener/client/prometheus';

export interface IPrometheusService {
	readonly type: 'prometheus';
	readonly readOnly: true;
	query(input: PrometheusQueryInput, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<PrometheusQueryResponse>;
	queryRange(input: PrometheusQueryRangeInput, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<PrometheusQueryResponse>;
	series(input: PrometheusSeriesInput, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<PrometheusSeriesResponse>;
	labels(input?: PrometheusLabelsInput, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<PrometheusLabelValuesResponse>;
	labelValues(input: PrometheusLabelValuesInput, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<PrometheusLabelValuesResponse>;
	metadata(input?: PrometheusMetadataInput, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<PrometheusMetadataResponse>;
	close(): Promise<void>;
}
export type PrometheusService = IPrometheusService;

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);
export const PrometheusServiceOptionsSchema = Object.assign(z.strictObject({
	apiPrefix: z.string().min(1).max(256).optional(),
	accessToken: z.string().min(1).optional(),
	accessTokenEnv: envName.optional(),
	username: z.string().min(1).optional(),
	usernameEnv: envName.optional(),
	password: z.string().optional(),
	passwordEnv: envName.optional(),
	timeoutMs: z.number().int().min(1).max(3_600_000).optional(),
	maxResponseBytes: z.number().int().min(1).max(64 * 1024 * 1024).optional(),
}), {
	jsonSchema: {
		type: 'object',
		properties: {
			apiPrefix: { type: 'string' }, accessToken: { type: 'string' }, accessTokenEnv: { type: 'string' },
			username: { type: 'string' }, usernameEnv: { type: 'string' }, password: { type: 'string' }, passwordEnv: { type: 'string' },
			timeoutMs: { type: 'integer', minimum: 1 }, maxResponseBytes: { type: 'integer', minimum: 1 },
		},
		additionalProperties: false,
	},
});
const configOptions = PrometheusServiceOptionsSchema;

function clientOptions({ config, getEnv }: ServiceProviderContext): PrometheusClientOptions {
	if (!config.baseUrl) throw new Error('Prometheus service requires baseUrl');
	const parsed = configOptions.safeParse(config.options ?? {});
	if (!parsed.success) throw new Error('Invalid Prometheus service configuration');
	const value = parsed.data;
	function credential(name: 'accessToken' | 'username' | 'password'): string | undefined {
		const reference = value[`${name}Env`];
		if (value[name] !== undefined && reference !== undefined) throw new Error('Conflicting Prometheus credential configuration');
		if (reference === undefined) return value[name];
		const secret = getEnv?.(reference);
		if (secret === undefined || !secret.length) throw new Error('Prometheus credential environment variable is unavailable');
		return secret;
	}
	return {
		baseUrl: config.baseUrl,
		apiPrefix: value.apiPrefix,
		accessToken: credential('accessToken'),
		username: credential('username'),
		password: credential('password'),
		timeoutMs: value.timeoutMs,
		maxResponseBytes: value.maxResponseBytes,
		headers: config.headers,
	};
}

export const PrometheusServiceProvider: ServiceProviderDefinition<'prometheus'> = {
	name: 'prometheus',
	title: 'Prometheus',
	description: 'Query Prometheus metrics and discover series, labels and metric metadata.',
	examples: [
		{ command: 'woctl prometheus query up', description: 'Query the current target health.' },
		{ command: 'woctl prometheus labels', description: 'List available label names.' },
	],
	aliases: ['prom'],
	provides: ['prometheus'],
	optionsSchema: PrometheusServiceOptionsSchema,
	operations: PrometheusOperations,
	create(context) {
		if (context.config.readOnly === false) throw new Error('Prometheus service must be read-only');
		const client = new PrometheusClient({ ...clientOptions(context), fetch: context.fetch });
		return {
			prometheus: {
				type: 'prometheus', readOnly: true as const,
				query: (input, options) => client.query(input, options),
				queryRange: (input, options) => client.queryRange(input, options),
				series: (input, options) => client.series(input, options),
				labels: (input, options) => client.labels(input, options),
				labelValues: (input, options) => client.labelValues(input, options),
				metadata: (input, options) => client.metadata(input, options),
				close: () => client.close(),
			},
		};
	},
};
