import { z } from 'zod/v4';

export const LinearServiceType = 'linear' as const;
export const DefaultLinearBaseUrl = 'https://api.linear.app/graphql';
export const DefaultLinearRequestTimeoutMs = 30_000;
export const DefaultLinearMaxResponseBytes = 8 * 1024 * 1024;

export const LinearBaseUrlSchema = z.url().superRefine((value, context) => {
	const url = new URL(value);
	if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
		context.addIssue({ code: 'custom', message: 'Linear baseUrl must be a credential-free HTTP or HTTPS URL' });
	}
}).transform((value) => value.replace(/\/+$/u, ''));

// Preserve personal API keys verbatim: only OAuth access tokens receive a Bearer prefix.
export const LinearCredentialSchema = z.string().min(1).refine((value) => value.trim().length > 0, {
	message: 'Linear credential must not be empty',
}).meta({ 'x-sensitive': true });

export const LinearTransportFields = {
	requestTimeoutMs: z.coerce.number().int().min(1_000).max(120_000).default(DefaultLinearRequestTimeoutMs),
	maxResponseBytes: z.coerce.number().int().min(1_024).max(32 * 1024 * 1024).default(DefaultLinearMaxResponseBytes),
	maxRetries: z.coerce.number().int().min(0).max(5).default(2),
	maxRetryDelayMs: z.coerce.number().int().min(0).max(30_000).default(5_000),
};

export const LinearConnectionConfigSchema = z.object({
	type: z.literal(LinearServiceType).default(LinearServiceType),
	api: z.literal(LinearServiceType).default(LinearServiceType),
	baseUrl: LinearBaseUrlSchema.default(DefaultLinearBaseUrl),
	apiKey: LinearCredentialSchema.optional(),
	accessToken: LinearCredentialSchema.optional(),
	readOnly: z.boolean().default(true),
	...LinearTransportFields,
}).superRefine((config, context) => {
	if (Boolean(config.apiKey) === Boolean(config.accessToken)) {
		context.addIssue({ code: 'custom', message: 'Linear requires exactly one of apiKey or accessToken' });
	}
});

export type LinearConnectionConfig = z.output<typeof LinearConnectionConfigSchema>;
export type LinearConnectionConfigInput = z.input<typeof LinearConnectionConfigSchema>;
