import { z } from 'zod';
import { RedisServiceError, RedisServiceErrorCodes } from './errors';
import type { RedisConnectionOptions } from './interface';

export const DefaultRedisMaxResponseBytes = 16 * 1024 * 1024;
export const MaximumRedisMaxResponseBytes = 64 * 1024 * 1024;
const timeout = z.coerce.number().int().min(0).max(2_147_483_647);
const databaseIndex = z.coerce.number().int().min(0).max(4_294_967_295);
const host = z.string().trim().min(1).max(255).refine(
	(value) => !/[\s\u0000-\u001f\u007f]/u.test(value) && !value.includes('/') && !value.includes('@') && !value.includes('://'),
	{ message: 'Redis host is invalid' },
);
export const RedisProductSchema = z.enum(['unspecified', 'redis', 'valkey']);
export const RedisTlsConfigSchema = z.strictObject({
	mode: z.enum(['disabled', 'verify-ca', 'verify-full']).default('verify-full'),
	serverName: z.string().trim().min(1).max(253).optional(),
	ca: z.string().optional(), cert: z.string().optional(), key: z.string().optional(), passphrase: z.string().optional(),
	insecureSkipVerify: z.literal(false).optional(),
}).superRefine((tls, context) => {
	if ((tls.cert !== undefined) !== (tls.key !== undefined) || (tls.passphrase !== undefined && tls.key === undefined))
		context.addIssue({ code: 'custom', message: 'Redis TLS client credentials are incomplete' });
	if (tls.mode === 'disabled' && [tls.serverName, tls.ca, tls.cert, tls.key, tls.passphrase].some((value) => value !== undefined))
		context.addIssue({ code: 'custom', message: 'Disabled Redis TLS cannot include TLS material' });
});
const optionFields = {
	product: RedisProductSchema.optional(), host: host.optional(), port: z.coerce.number().int().min(1).max(65_535).optional(),
	databaseIndex: databaseIndex.optional(), username: z.string().optional(), password: z.string().optional(),
	keyPrefix: z.string().optional(), tls: RedisTlsConfigSchema.optional(),
	connectTimeoutMs: timeout.optional(), requestTimeoutMs: timeout.optional(),
	maxRetries: z.coerce.number().int().min(0).max(4_294_967_295).optional(),
	maxResponseBytes: z.coerce.number().int().min(1).max(MaximumRedisMaxResponseBytes).optional(),
};
export const RedisServiceOptionsSchema = Object.assign(z.strictObject(optionFields), {
	jsonSchema: z.toJSONSchema(z.strictObject(optionFields), { io: 'input' }),
});
export const RedisOptionsSchema = RedisServiceOptionsSchema;
export const RedisServiceConfigSchema = z.object({
	baseUrl: z.string().optional(), options: RedisServiceOptionsSchema.default({}), readOnly: z.literal(true).default(true),
});
export type RedisServiceConfigInput = z.input<typeof RedisServiceConfigSchema>;
export type RedisServiceConfig = z.output<typeof RedisServiceConfigSchema>;
export const RedisConnectionConfigSchema = z.strictObject({
	...optionFields, product: RedisProductSchema.default('unspecified'), host,
	port: z.coerce.number().int().min(1).max(65_535).default(6379),
	keyPrefix: z.string().default(''),
	maxResponseBytes: z.coerce.number().int().min(1).max(MaximumRedisMaxResponseBytes).default(DefaultRedisMaxResponseBytes),
});
export type RedisConnectionConfig = z.output<typeof RedisConnectionConfigSchema>;
export type RedisConnectionConfigInput = z.input<typeof RedisConnectionConfigSchema>;

/** References are materialized by the registry before this function is called. */
export function resolveRedisConnectionOptions(config: RedisServiceConfigInput): RedisConnectionOptions {
	try {
		const { baseUrl, options } = RedisServiceConfigSchema.parse(config);
		let endpoint: Partial<RedisConnectionOptions> = {};
		if (baseUrl !== undefined) {
			const url = new URL(baseUrl);
			if (!['redis:', 'rediss:'].includes(url.protocol) || url.search || url.hash || !url.hostname) throw new Error();
			const path = url.pathname.replace(/^\//u, '');
			if (path && !/^\d+$/u.test(path)) throw new Error();
			endpoint = {
				host: url.hostname.replace(/^\[|\]$/gu, ''), port: url.port ? Number(url.port) : 6379,
				...(url.username ? { username: decodeURIComponent(url.username) } : {}),
				...(url.password ? { password: decodeURIComponent(url.password) } : {}),
				...(path ? { databaseIndex: Number(path) } : {}),
			};
			if (url.protocol === 'rediss:') {
				if (options.tls?.mode === 'disabled') throw new Error();
				endpoint.tls = { mode: 'verify-full' };
			}
		}
		return RedisConnectionConfigSchema.parse({ ...endpoint, ...options });
	} catch {
		throw new RedisServiceError(RedisServiceErrorCodes.InvalidConfig, 'Invalid Redis service configuration');
	}
}
