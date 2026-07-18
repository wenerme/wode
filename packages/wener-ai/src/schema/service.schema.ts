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

const ServiceShape = {
	id: ConfigIdentitySchema,
	name: ConfigIdentitySchema,
	title: z.string().optional(),
	description: z.string().optional(),
	/** Service category. This is semantically distinct from apiType. */
	type: z.string().min(1).optional(),
	apiType: z.string().min(1).optional(),
	stage: z.string().optional(),
	environment: z.string().optional(),
	env: z.union([z.string(), ConfigStringMapSchema]).optional(),
	baseUrl: ConfigUrlSchema.optional(),
	host: z.string().optional(),
	port: z.union([z.string(), z.number().int().positive()]).optional(),
	providerId: ConfigIdentitySchema.optional(),
	endpoints: z.array(ConfigIdentitySchema).optional(),
	defaultEndpointId: ConfigIdentitySchema.optional(),
	endpointKey: ConfigIdentitySchema.optional(),
	apiKey: z.string().optional(),
	username: z.string().optional(),
	password: z.string().optional(),
	headers: ConfigStringMapSchema.optional(),
	auth: z.union([z.string(), ConfigValueMapSchema]).optional(),
	credentials: ConfigValueMapSchema.optional(),
	capabilities: z.array(z.string().min(1)).optional(),
	tags: ConfigTagsSchema.optional(),
	labels: ConfigLabelsSchema.optional(),
	notes: z.string().optional(),
	options: ConfigValueMapSchema.optional(),
	extensions: ConfigExtensionsSchema.optional(),
	enabled: z.boolean().optional(),
};

export const ServiceSchema = z.strictObject(ServiceShape).superRefine((value, context) => {
	if (!value.type && !value.apiType) {
		context.addIssue({ code: 'custom', message: 'service requires type or apiType', path: ['type'] });
	}
	if (value.endpoints && new Set(value.endpoints).size !== value.endpoints.length) {
		context.addIssue({
			code: 'custom',
			message: 'endpoints must not contain duplicate identities',
			path: ['endpoints'],
		});
	}
	if (value.defaultEndpointId && value.endpointKey) {
		context.addIssue({
			code: 'custom',
			message: 'defaultEndpointId and endpointKey are mutually exclusive',
			path: ['endpointKey'],
		});
	}
});
export type Service = z.infer<typeof ServiceSchema>;

export const ServiceCompatibilityInputSchema = z
	.strictObject({
		...ServiceShape,
		api: z.string().min(1).optional(),
		url: ConfigUrlSchema.optional(),
		disabled: z.boolean().optional(),
	})
	.superRefine((value, context) => {
		const error = enabledCompatibilityError(value);
		if (error) context.addIssue({ code: 'custom', message: error, path: ['enabled'] });
	})
	.transform(
		({ api, url, disabled, ...canonical }): z.input<typeof ServiceSchema> => ({
			...canonical,
			apiType: canonical.apiType ?? api,
			baseUrl: canonical.baseUrl ?? url,
			enabled: canonical.enabled ?? !(disabled ?? false),
		}),
	)
	.pipe(ServiceSchema);
export type ServiceCompatibilityInput = z.input<typeof ServiceCompatibilityInputSchema>;

export function normalizeService(input: ServiceCompatibilityInput): Service {
	return ServiceCompatibilityInputSchema.parse(input);
}
