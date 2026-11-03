import { z } from 'zod';

export const ApolloServiceType = 'apollo' as const;
export const ApolloEndpointRole = Object.freeze({ Config: 'config', Admin: 'admin', Portal: 'portal' } as const);
export type ApolloEndpointRole = (typeof ApolloEndpointRole)[keyof typeof ApolloEndpointRole];

const SecretStringSchema = z.string().meta({ 'x-sensitive': true });
const ApolloBaseUrlSchema = z
	.url()
	.superRefine((value, context) => {
		const url = new URL(value);
		if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
			context.addIssue({ code: 'custom', message: 'Apollo endpoint must be a credential-free HTTP or HTTPS URL' });
		}
	})
	.transform((value) => value.replace(/\/+$/u, ''));

export const ApolloTokenAuthSchema = z.object({
	type: z.literal('token'),
	token: SecretStringSchema.trim().min(1).meta({ 'x-sensitive': true }),
});
export const ApolloBasicAuthSchema = z.object({
	type: z.literal('basic'),
	username: SecretStringSchema.trim().min(1).meta({ 'x-sensitive': true }),
	password: SecretStringSchema.min(1).meta({ 'x-sensitive': true }),
});
export const ApolloHttpAuthSchema = z.discriminatedUnion('type', [ApolloTokenAuthSchema, ApolloBasicAuthSchema]);
export const ApolloConfigAuthSchema = z.object({
	type: z.literal('app-secret'),
	appSecret: SecretStringSchema.min(1).meta({ 'x-sensitive': true }),
});

const ApolloEndpointFields = {
	baseUrl: ApolloBaseUrlSchema,
	headers: z.record(z.string(), SecretStringSchema).default({}).meta({ 'x-sensitive': true }),
	requestTimeoutMs: z.number().int().min(1).max(300_000).optional(),
};
export const ApolloConfigEndpointSchema = z.object({
	role: z.literal(ApolloEndpointRole.Config).default(ApolloEndpointRole.Config),
	...ApolloEndpointFields,
	auth: ApolloConfigAuthSchema.optional(),
});
export const ApolloAdminEndpointSchema = z.object({
	role: z.literal(ApolloEndpointRole.Admin).default(ApolloEndpointRole.Admin),
	...ApolloEndpointFields,
	auth: ApolloHttpAuthSchema.optional(),
});
export const ApolloPortalEndpointSchema = z.object({
	role: z.literal(ApolloEndpointRole.Portal).default(ApolloEndpointRole.Portal),
	...ApolloEndpointFields,
	auth: ApolloHttpAuthSchema.optional(),
});

/** Public service options live under `{ type: 'apollo', options: { config, admin, portal, ... } }`. */
const OptionsSchema = z.strictObject({
	appId: z.string().trim().min(1).optional(),
	cluster: z.string().trim().min(1).default('default'),
	namespace: z.string().trim().min(1).default('application'),
	env: z.string().trim().min(1).default('DEV'),
	operator: z.string().trim().min(1).optional(),
	config: ApolloConfigEndpointSchema,
	admin: ApolloAdminEndpointSchema,
	portal: ApolloPortalEndpointSchema,
});

export const ApolloServiceOptionsSchema = Object.assign(OptionsSchema, {
	jsonSchema: z.toJSONSchema(OptionsSchema, { io: 'input' }),
});

/** Internal connection shape, independent of the host service registry or configuration store. */
export const ApolloConnectionConfigSchema = OptionsSchema.extend({
	type: z.literal(ApolloServiceType).default(ApolloServiceType),
	api: z.literal(ApolloServiceType).default(ApolloServiceType),
	readOnly: z.boolean().default(true),
});
export const ApolloServiceConfigSchema = z.strictObject({
	type: z.literal(ApolloServiceType),
	readOnly: z.boolean().default(true),
	options: ApolloServiceOptionsSchema,
});

export type ApolloTokenAuth = z.output<typeof ApolloTokenAuthSchema>;
export type ApolloBasicAuth = z.output<typeof ApolloBasicAuthSchema>;
export type ApolloHttpAuth = z.output<typeof ApolloHttpAuthSchema>;
export type ApolloConfigAuth = z.output<typeof ApolloConfigAuthSchema>;
export type ApolloConfigEndpoint = z.output<typeof ApolloConfigEndpointSchema>;
export type ApolloAdminEndpoint = z.output<typeof ApolloAdminEndpointSchema>;
export type ApolloPortalEndpoint = z.output<typeof ApolloPortalEndpointSchema>;
export type ApolloServiceOptions = z.input<typeof ApolloServiceOptionsSchema>;
export type ApolloServiceConfigInput = z.input<typeof ApolloServiceConfigSchema>;
export type ApolloServiceConfig = z.output<typeof ApolloServiceConfigSchema>;
export type ApolloConnectionConfigInput = z.input<typeof ApolloConnectionConfigSchema>;
export type ApolloConnectionConfig = z.output<typeof ApolloConnectionConfigSchema>;
