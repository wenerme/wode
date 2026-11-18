import {
	type GoogleAnalyticsCredential,
	GoogleAnalyticsClient,
	type GoogleAnalyticsRequestOptions,
	parseGoogleServiceAccountKey,
} from '@wener/client/google-analytics';
import { z } from 'zod';
import type { ServiceProviderDefinition } from '../registry';
import type { ServiceProviderContext } from '../runtime/types';
import { GoogleAnalyticsServiceCapability, type IGoogleAnalyticsService } from './IGoogleAnalyticsService';
import { GoogleAnalyticsOperations } from './operations';
import {
	type GoogleAnalyticsServiceCallOptions,
	GoogleAnalyticsServiceContract,
	type GoogleAnalyticsServiceOutputs,
} from './GoogleAnalyticsServiceContract';

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);

/**
 * Provider options. Secrets may be inline or referenced by env name; both are resolved lazily on
 * the first call, never during schema/help/inspect. `serviceAccountJson` is a service-account key
 * JSON string (the host may load it from a file into an env variable).
 */
export const GoogleAnalyticsServiceOptionsSchema = z.strictObject({
	projectId: z.string().regex(/^[A-Za-z0-9._:-]{1,128}$/u).optional(),
	accessToken: z.string().min(1).optional(),
	accessTokenEnv: envName.optional(),
	serviceAccountJson: z.string().min(1).optional(),
	serviceAccountJsonEnv: envName.optional(),
	dataBaseUrl: z.string().url().optional(),
	adminBaseUrl: z.string().url().optional(),
	timeoutMs: z.number().int().min(1).max(3_600_000).optional(),
	maxResponseBytes: z.number().int().min(1).max(64 * 1024 * 1024).optional(),
});
export type GoogleAnalyticsServiceOptions = z.infer<typeof GoogleAnalyticsServiceOptionsSchema>;

function parseOptions(config: ServiceProviderContext['config']): GoogleAnalyticsServiceOptions {
	const parsed = GoogleAnalyticsServiceOptionsSchema.safeParse(config.options ?? {});
	if (!parsed.success) throw new Error('Invalid Google Analytics service configuration');
	const value = parsed.data;
	const sources = [value.accessToken, value.accessTokenEnv, value.serviceAccountJson, value.serviceAccountJsonEnv].filter((v) => v !== undefined);
	if (sources.length !== 1) throw new Error('Google Analytics service requires exactly one credential source');
	return value;
}

/** Resolve the configured credential; called by the client inside the per-call deadline. */
function credentialResolver(value: GoogleAnalyticsServiceOptions, getEnv: ServiceProviderContext['getEnv']): () => GoogleAnalyticsCredential {
	return () => {
		const read = (inline: string | undefined, reference: string | undefined) => {
			if (reference === undefined) return inline;
			const secret = getEnv?.(reference);
			if (!secret) throw new Error('Google Analytics credential environment variable is unavailable');
			return secret;
		};
		const token = read(value.accessToken, value.accessTokenEnv);
		if (token !== undefined) return { accessToken: token };
		const json = read(value.serviceAccountJson, value.serviceAccountJsonEnv);
		return { serviceAccount: parseGoogleServiceAccountKey(json) };
	};
}

function requestOptions(options?: GoogleAnalyticsServiceCallOptions): GoogleAnalyticsRequestOptions | undefined {
	return options === undefined ? undefined : { signal: options.signal, timeoutMs: options.context?.timeoutMs };
}

/** Validate supplier JSON against the stable envelope; failures never echo response content. */
async function output<K extends keyof GoogleAnalyticsServiceOutputs>(key: K, pending: Promise<unknown>): Promise<GoogleAnalyticsServiceOutputs[K]> {
	const parsed = GoogleAnalyticsServiceContract[key]['~orpc'].outputSchema!.safeParse(await pending);
	if (!parsed.success) throw new TypeError('Invalid Google Analytics response');
	return parsed.data as GoogleAnalyticsServiceOutputs[K];
}

export const GoogleAnalyticsServiceProvider: ServiceProviderDefinition<IGoogleAnalyticsService> = {
	name: 'google-analytics',
	title: 'Google Analytics',
	description: 'Query Google Analytics (GA4) account summaries, property metadata and standard or realtime reports.',
	examples: [
		{ command: 'woctl google-analytics status', description: 'List accessible accounts and properties.' },
		{ command: 'woctl ga report run --property 123 --dimension date --metric activeUsers', description: 'Run a standard report.' },
	],
	aliases: ['ga'],
	provides: [GoogleAnalyticsServiceCapability],
	optionsSchema: GoogleAnalyticsServiceOptionsSchema,
	operations: GoogleAnalyticsOperations,
	create({ config, getEnv, fetch }) {
		if (config.readOnly === false) throw new Error('Google Analytics service must be read-only');
		const value = parseOptions(config);
		const client = new GoogleAnalyticsClient({
			credentials: credentialResolver(value, getEnv),
			projectId: value.projectId,
			dataBaseUrl: value.dataBaseUrl,
			adminBaseUrl: value.adminBaseUrl,
			timeoutMs: value.timeoutMs,
			maxResponseBytes: value.maxResponseBytes,
			fetch,
		});
		const service: IGoogleAnalyticsService = {
			type: 'google-analytics',
			readOnly: true,
			listAccountSummaries: (input, options) => output('listAccountSummaries', client.listAccountSummaries(input, requestOptions(options))),
			getProperty: (input, options) => output('getProperty', client.getProperty(input, requestOptions(options))),
			getMetadata: (input, options) => output('getMetadata', client.getMetadata(input, requestOptions(options))),
			runReport: (input, options) => output('runReport', client.runReport(input, requestOptions(options))),
			runRealtimeReport: (input, options) => output('runRealtimeReport', client.runRealtimeReport(input, requestOptions(options))),
			close: () => client.close(),
			[Symbol.asyncDispose]: () => client.close(),
		};
		return { 'google-analytics': service };
	},
};
