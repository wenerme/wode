import {
	isPowerDnsWriteRequest,
	PowerDnsClient,
	type PowerDnsRequestOptions,
} from '@wener/client/powerdns';
import { z } from 'zod';
import type { ServiceProviderContext } from '../runtime/types';
import type { IPowerDnsService } from './IPowerDnsService';

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);
/** Provider options shared by the `dns` and `powerdns` capabilities of the PowerDNS provider. */
export const PowerDnsServiceOptionsSchema = Object.assign(
	z.strictObject({
		apiKey: z.string().min(1).optional(),
		apiKeyEnv: envName.optional(),
		server: z.string().trim().min(1).max(512).optional(),
		timeoutMs: z.number().int().min(1).max(3_600_000).optional(),
		maxResponseBytes: z.number().int().min(1).max(64 * 1024 * 1024).optional(),
	}),
	{
		jsonSchema: {
			type: 'object',
			properties: {
				apiKey: { type: 'string', description: 'PowerDNS API key; prefer apiKeyEnv.' },
				apiKeyEnv: { type: 'string', description: 'Environment variable holding the API key.' },
				server: { type: 'string', description: 'Default server id (localhost).' },
				timeoutMs: { type: 'integer', minimum: 1 },
				maxResponseBytes: { type: 'integer', minimum: 1 },
			},
			additionalProperties: false,
		},
	},
);

/** Maps oRPC call options (signal + context.timeoutMs) to client request options. */
export function powerDnsRequestOptions(options?: { signal?: AbortSignal; context?: { timeoutMs?: number } }): PowerDnsRequestOptions | undefined {
	return options === undefined ? undefined : { signal: options.signal, timeoutMs: options.context?.timeoutMs };
}

/** Credentials are resolved only when a service instance is created, never during discovery. */
export function createPowerDnsClientFromContext({ config, getEnv, fetch }: ServiceProviderContext): PowerDnsClient {
	if (!config.baseUrl) throw new Error('PowerDNS service requires baseUrl');
	const parsed = PowerDnsServiceOptionsSchema.safeParse(config.options ?? {});
	if (!parsed.success) throw new Error('Invalid PowerDNS service configuration');
	const value = parsed.data;
	if (value.apiKey !== undefined && value.apiKeyEnv !== undefined) throw new Error('Conflicting PowerDNS credential configuration');
	let apiKey = value.apiKey;
	if (value.apiKeyEnv !== undefined) {
		apiKey = getEnv?.(value.apiKeyEnv);
		if (!apiKey) throw new Error('PowerDNS credential environment variable is unavailable');
	}
	if (!apiKey) throw new Error('PowerDNS service requires apiKey or apiKeyEnv');
	return new PowerDnsClient({
		baseUrl: config.baseUrl,
		apiKey,
		server: value.server,
		timeoutMs: value.timeoutMs,
		maxResponseBytes: value.maxResponseBytes,
		headers: config.headers,
		fetch,
	});
}

const done = (result?: unknown) => (result === undefined ? { ok: true as const } : { ok: true as const, result });

/** PowerDNS-only extension service over a shared client; `close` is owned by the caller's client lifecycle. */
export function createPowerDnsExtensionService(client: PowerDnsClient, readOnly: boolean, close: () => Promise<void> = () => client.close()): IPowerDnsService {
	const writable = () => {
		if (readOnly) throw new Error('Selected service is read-only');
	};
	const o = powerDnsRequestOptions;
	const service: IPowerDnsService = {
		type: 'powerdns',
		readOnly,
		listServer: (_input, options) => client.listServer(o(options)),
		getServer: (input, options) => client.getServer(input, o(options)),
		listServerStatistic: (input, options) => client.listServerStatistic(input, o(options)),
		searchData: (input, options) => client.searchData(input, o(options)),
		async createPowerDnsZone({ dryRun, ...input }, options) {
			if (dryRun === true) {
				const request = client.prepareCreateZone(input);
				return { ok: true, dryRun: true, request: { method: request.method, path: request.path, body: request.body } };
			}
			writable();
			return client.createZone(input, o(options));
		},
		async notifyZone(input, options) {
			writable();
			return done(await client.notifyZone(input, o(options)));
		},
		async retrieveZoneAxfr(input, options) {
			writable();
			return done(await client.retrieveZoneAxfr(input, o(options)));
		},
		listMetadata: (input, options) => client.listMetadata(input, o(options)),
		getMetadata: (input, options) => client.getMetadata(input, o(options)),
		async setMetadata(input, options) {
			writable();
			return client.setMetadata(input, o(options));
		},
		async deleteMetadata(input, options) {
			writable();
			await client.deleteMetadata(input, o(options));
			return done();
		},
		listCryptokey: (input, options) => client.listCryptokey(input, o(options)),
		getCryptokey: (input, options) => client.getCryptokey(input, o(options)),
		async createCryptokey(input, options) {
			writable();
			return client.createCryptokey(input, o(options));
		},
		async updateCryptokey(input, options) {
			writable();
			await client.updateCryptokey(input, o(options));
			return done();
		},
		async deleteCryptokey(input, options) {
			writable();
			await client.deleteCryptokey(input, o(options));
			return done();
		},
		listTsigKey: (input, options) => client.listTsigKey(input, o(options)),
		getTsigKey: (input, options) => client.getTsigKey(input, o(options)),
		async createTsigKey(input, options) {
			writable();
			return client.createTsigKey(input, o(options));
		},
		async updateTsigKey(input, options) {
			writable();
			return client.updateTsigKey(input, o(options));
		},
		async deleteTsigKey(input, options) {
			writable();
			await client.deleteTsigKey(input, o(options));
			return done();
		},
		async request(input, options) {
			if (isPowerDnsWriteRequest(input)) writable();
			return client.request(input, o(options));
		},
		close,
		[Symbol.asyncDispose]() {
			return this.close();
		},
	};
	return service;
}
