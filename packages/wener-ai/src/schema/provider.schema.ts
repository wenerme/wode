import { z } from 'zod';
import {
	ConfigExtensionsSchema,
	ConfigIdentitySchema,
	ConfigLabelsSchema,
	ConfigStringMapSchema,
	ConfigTagsSchema,
	ConfigUrlSchema,
	ConfigValueMapSchema,
	enabledCompatibilityError,
} from './config-common';

const ProviderShape = {
	id: ConfigIdentitySchema,
	name: ConfigIdentitySchema,
	title: z.string().optional(),
	description: z.string().optional(),
	/** Backend/provider category. This is semantically distinct from apiType. */
	type: z.string().min(1).optional(),
	apiType: z.string().min(1).optional(),
	baseUrl: ConfigUrlSchema.optional(),
	apiKey: z.string().optional(),
	headers: ConfigStringMapSchema.optional(),
	env: ConfigStringMapSchema.optional(),
	envVars: z.array(z.string().min(1)).optional(),
	credentials: ConfigValueMapSchema.optional(),
	proxy: z.boolean().optional(),
	proxyMode: z.enum(['proxy', 'direct']).optional(),
	presetId: z.string().min(1).optional(),
	endpoints: z.array(ConfigIdentitySchema).optional(),
	defaultEndpointId: ConfigIdentitySchema.optional(),
	defaultModelId: ConfigIdentitySchema.optional(),
	capabilities: z.array(z.string().min(1)).optional(),
	tags: ConfigTagsSchema.optional(),
	labels: ConfigLabelsSchema.optional(),
	notes: z.string().optional(),
	options: ConfigValueMapSchema.optional(),
	extensions: ConfigExtensionsSchema.optional(),
	enabled: z.boolean().optional(),
};

export const ProviderSchema = z.strictObject(ProviderShape).superRefine((value, context) => {
	if (value.endpoints && new Set(value.endpoints).size !== value.endpoints.length) {
		context.addIssue({
			code: 'custom',
			message: 'endpoints must not contain duplicate identities',
			path: ['endpoints'],
		});
	}
});
export type Provider = z.infer<typeof ProviderSchema>;

export const ProviderCompatibilityInputSchema = z
	.strictObject({
		...ProviderShape,
		api: z.string().min(1).optional(),
		url: ConfigUrlSchema.optional(),
		disabled: z.boolean().optional(),
	})
	.superRefine((value, context) => {
		const error = enabledCompatibilityError(value);
		if (error) context.addIssue({ code: 'custom', message: error, path: ['enabled'] });
	})
	.transform(
		({ api, url, disabled, ...canonical }): z.input<typeof ProviderSchema> => ({
			...canonical,
			apiType: canonical.apiType ?? api,
			baseUrl: canonical.baseUrl ?? url,
			enabled: canonical.enabled ?? !(disabled ?? false),
		}),
	)
	.pipe(ProviderSchema);
export type ProviderCompatibilityInput = z.input<typeof ProviderCompatibilityInputSchema>;

export function normalizeProvider(input: ProviderCompatibilityInput): Provider {
	return ProviderCompatibilityInputSchema.parse(input);
}
