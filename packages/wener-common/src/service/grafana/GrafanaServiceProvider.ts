import { GrafanaClient, isGrafanaWriteMethod, type GrafanaClientOptions, type GrafanaRequestOptions } from '@wener/client/grafana';
import { z } from 'zod';
import type { ServiceProviderDefinition } from '../registry';
import type { ServiceProviderContext } from '../runtime/types';
import type { IGrafanaService } from './IGrafanaService';
import { GrafanaOperations } from './operations';
import { GrafanaServiceCapability } from './IGrafanaService';
import type { GrafanaServiceCallOptions } from './GrafanaServiceContract';

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);
export const GrafanaServiceOptionsSchema = Object.assign(z.strictObject({
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
			accessToken: { type: 'string' }, accessTokenEnv: { type: 'string' },
			username: { type: 'string' }, usernameEnv: { type: 'string' }, password: { type: 'string' }, passwordEnv: { type: 'string' },
			timeoutMs: { type: 'integer', minimum: 1 }, maxResponseBytes: { type: 'integer', minimum: 1 },
		},
		additionalProperties: false,
	},
});
const configOptions = GrafanaServiceOptionsSchema;

function requestOptions(options?: GrafanaServiceCallOptions): GrafanaRequestOptions | undefined {
	return options === undefined ? undefined : { signal: options.signal, timeoutMs: options.context?.timeoutMs };
}

function clientOptions({ config, getEnv }: ServiceProviderContext): GrafanaClientOptions {
	if (!config.baseUrl) throw new Error('Grafana service requires baseUrl');
	const parsed = configOptions.safeParse(config.options ?? {});
	if (!parsed.success) throw new Error('Invalid Grafana service configuration');
	const value = parsed.data;
	function credential(name: 'accessToken' | 'username' | 'password'): string | undefined {
		const reference = value[`${name}Env`];
		if (value[name] !== undefined && reference !== undefined) throw new Error('Conflicting Grafana credential configuration');
		if (reference === undefined) return value[name];
		const secret = getEnv?.(reference);
		if (secret === undefined || !secret.length) throw new Error('Grafana credential environment variable is unavailable');
		return secret;
	}
	return {
		baseUrl: config.baseUrl,
		accessToken: credential('accessToken'),
		username: credential('username'),
		password: credential('password'),
		timeoutMs: value.timeoutMs,
		maxResponseBytes: value.maxResponseBytes,
		headers: config.headers,
	};
}

export const GrafanaServiceProvider: ServiceProviderDefinition<IGrafanaService> = {
	name: 'grafana',
	title: 'Grafana',
	description: 'Manage classic Grafana dashboards and panels, inspect health and call the authenticated HTTP API.',
	examples: [
		{ command: 'woctl grafana status', description: 'Check Grafana health.' },
		{ command: 'woctl grafana api /api/search --query type=dash-db', description: 'List dashboards.' },
	],
	aliases: ['gf'],
	provides: [GrafanaServiceCapability],
	optionsSchema: GrafanaServiceOptionsSchema,
	operations: GrafanaOperations,
	create(context) {
		const client = new GrafanaClient({ ...clientOptions(context), fetch: context.fetch });
		const readOnly = context.config.readOnly !== false;
		const writable = () => {
			if (!readOnly) return;
			throw new Error('Selected service is read-only');
		};
		const service: IGrafanaService = {
			type: 'grafana', readOnly,
			health: (_input, options) => client.health(requestOptions(options)),
			whoami: (_input, options) => client.whoami(requestOptions(options)),
			async request(input, options) {
				if (isGrafanaWriteMethod(input.method ?? (input.body === undefined ? 'GET' : 'POST'))) writable();
				return client.request(input, requestOptions(options));
			},
			listDashboard: (input, options) => client.listDashboard(input, requestOptions(options)),
			getDashboard: (input, options) => client.getDashboard(input, requestOptions(options)),
			async updateDashboard(input, options) {
				if (input.dryRun !== true) writable();
				return client.updateDashboard(input, requestOptions(options));
			},
			getPanel: (input, options) => client.getPanel(input, requestOptions(options)),
			listPanel: (input, options) => client.listPanel(input, requestOptions(options)),
			async patchPanel(input, options) {
				if (input.dryRun !== true) writable();
				return client.patchPanel(input, requestOptions(options));
			},
			close: () => client.close(),
			[Symbol.asyncDispose]() {
				return this.close();
			},
		};
		return { grafana: service };
	},
};
