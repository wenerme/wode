import { z } from 'zod/v4';
import {
	LinearBaseUrlSchema, LinearConnectionConfigSchema, LinearCredentialSchema, LinearTransportFields,
	LinearServiceError, LinearServiceErrorCodes, type LinearConnectionConfig,
} from '@wener/client/linear';

export { LinearConnectionConfigSchema } from '@wener/client/linear';
export type { LinearConnectionConfig, LinearConnectionConfigInput } from '@wener/client/linear';

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);
export const LinearServiceOptionsSchema = z.strictObject({
	apiKey: LinearCredentialSchema.optional().describe('Personal API key, passed verbatim in Authorization; supports env://NAME.'),
	apiKeyEnv: envName.optional().describe('Environment variable containing the personal API key.'),
	accessToken: LinearCredentialSchema.optional().describe('OAuth access token, passed with the Bearer scheme; supports env://NAME.'),
	accessTokenEnv: envName.optional().describe('Environment variable containing the OAuth access token.'),
	...LinearTransportFields,
}).superRefine((options, context) => {
	if ([options.apiKey, options.apiKeyEnv, options.accessToken, options.accessTokenEnv].filter((value) => value !== undefined).length !== 1) {
		context.addIssue({ code: 'custom', message: 'Linear requires exactly one authentication source' });
	}
});
export const LinearOptionsSchema = LinearServiceOptionsSchema;
export const LinearServiceConfigSchema = z.object({
	baseUrl: LinearBaseUrlSchema.optional(),
	readOnly: z.boolean().default(true),
	options: LinearServiceOptionsSchema,
});
export type LinearServiceOptions = z.input<typeof LinearServiceOptionsSchema>;
export type LinearServiceConfigInput = z.input<typeof LinearServiceConfigSchema>;
export type LinearServiceConfig = z.output<typeof LinearServiceConfigSchema>;

/** Called by a provider factory only; schema discovery never reads a host environment. */
export function resolveLinearConnectionOptions(
	config: unknown,
	getEnv?: (name: string) => string | undefined,
): LinearConnectionConfig {
	try {
		const { options, baseUrl, readOnly } = LinearServiceConfigSchema.parse(config);
		const { apiKey, apiKeyEnv, accessToken, accessTokenEnv, ...transport } = options;
		const materialize = (inline: string | undefined, name: string | undefined) => {
			if (name !== undefined) return requireEnv(name);
			const reference = inline && /^env:\/\/([A-Za-z_][A-Za-z0-9_]*)$/u.exec(inline);
			return reference ? requireEnv(reference[1]) : inline;
		};
		const requireEnv = (name: string): string => {
			const value = getEnv?.(name);
			if (typeof value !== 'string' || !value.trim()) throw new Error();
			return value;
		};
		return LinearConnectionConfigSchema.parse({
			...transport, baseUrl, readOnly,
			apiKey: materialize(apiKey, apiKeyEnv), accessToken: materialize(accessToken, accessTokenEnv),
		});
	} catch {
		throw new LinearServiceError(LinearServiceErrorCodes.InvalidConfig, 'Linear service configuration is invalid');
	}
}
