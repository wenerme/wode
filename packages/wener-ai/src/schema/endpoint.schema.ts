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

const EndpointShape = {
	id: ConfigIdentitySchema,
	name: ConfigIdentitySchema,
	providerId: ConfigIdentitySchema.optional(),
	key: ConfigIdentitySchema.optional(),
	title: z.string().optional(),
	description: z.string().optional(),
	apiType: z.string().min(1).optional(),
	baseUrl: ConfigUrlSchema.optional(),
	apiKey: z.string().optional(),
	headers: ConfigStringMapSchema.optional(),
	env: ConfigStringMapSchema.optional(),
	credentials: ConfigValueMapSchema.optional(),
	proxy: z.boolean().optional(),
	proxyMode: z.enum(['proxy', 'direct']).optional(),
	capabilities: z.array(z.string().min(1)).optional(),
	tags: ConfigTagsSchema.optional(),
	labels: ConfigLabelsSchema.optional(),
	options: ConfigValueMapSchema.optional(),
	extensions: ConfigExtensionsSchema.optional(),
	enabled: z.boolean().optional(),
};

export const EndpointSchema = z.strictObject(EndpointShape);
export type Endpoint = z.infer<typeof EndpointSchema>;

export const EndpointCompatibilityInputSchema = z
	.strictObject({
		...EndpointShape,
		api: z.string().min(1).optional(),
		type: z.string().min(1).optional(),
		url: ConfigUrlSchema.optional(),
		disabled: z.boolean().optional(),
	})
	.superRefine((value, context) => {
		const error = enabledCompatibilityError(value);
		if (error) context.addIssue({ code: 'custom', message: error, path: ['enabled'] });
	})
	.transform(
		({ api, type, url, disabled, ...canonical }): z.input<typeof EndpointSchema> => ({
			...canonical,
			apiType: canonical.apiType ?? api ?? type,
			baseUrl: canonical.baseUrl ?? url,
			enabled: canonical.enabled ?? !(disabled ?? false),
		}),
	)
	.pipe(EndpointSchema);
export type EndpointCompatibilityInput = z.input<typeof EndpointCompatibilityInputSchema>;

export function normalizeEndpoint(input: EndpointCompatibilityInput): Endpoint {
	return EndpointCompatibilityInputSchema.parse(input);
}

export function getEndpointUrl(endpoint: Pick<Endpoint, 'baseUrl'>): string | undefined {
	return endpoint.baseUrl;
}
