import { z } from 'zod';
import { ConfigExtensionsSchema, ConfigIdentitySchema, ConfigValueMapSchema } from './config-common';
import { type Endpoint, EndpointCompatibilityInputSchema, EndpointSchema } from './endpoint.schema';
import { type Model, ModelCompatibilityInputSchema, ModelSchema } from './model.schema';
import { type Provider, ProviderCompatibilityInputSchema, ProviderSchema } from './provider.schema';
import { type Service, ServiceCompatibilityInputSchema, ServiceSchema } from './service.schema';

export const AiConfigDefaultsSchema = z.strictObject({
	providerId: ConfigIdentitySchema.optional(),
	endpointId: ConfigIdentitySchema.optional(),
	modelId: ConfigIdentitySchema.optional(),
	serviceIds: z.array(ConfigIdentitySchema).optional(),
	extensions: ConfigExtensionsSchema.optional(),
});
export type AiConfigDefaults = z.infer<typeof AiConfigDefaultsSchema>;

const AiConfigBundleBaseSchema = z.strictObject({
	schemaVersion: z.number().int().positive().default(1),
	version: z.string().min(1).optional(),
	providers: z.array(ProviderSchema).default([]),
	endpoints: z.array(EndpointSchema).default([]),
	models: z.array(ModelSchema).default([]),
	services: z.array(ServiceSchema).default([]),
	defaults: AiConfigDefaultsSchema.optional(),
	metadata: ConfigValueMapSchema.optional(),
	extensions: ConfigExtensionsSchema.optional(),
});

export const AiConfigBundleSchema = AiConfigBundleBaseSchema.superRefine((bundle, context) => {
	const providers = identityMap(bundle.providers, 'providers', context);
	const endpoints = identityMap(bundle.endpoints, 'endpoints', context);
	const models = identityMap(bundle.models, 'models', context);
	const services = identityMap(bundle.services, 'services', context);

	for (const [index, endpoint] of bundle.endpoints.entries()) {
		if (endpoint.providerId && !providers.has(endpoint.providerId)) {
			addReferenceIssue(context, ['endpoints', index, 'providerId'], 'provider', endpoint.providerId);
		}
	}

	const endpointKeys = new Map<string, number>();
	for (const [index, endpoint] of bundle.endpoints.entries()) {
		if (!endpoint.key) continue;
		const key = `${endpoint.providerId ?? ''}\u0000${endpoint.key}`;
		const previous = endpointKeys.get(key);
		if (previous !== undefined) {
			context.addIssue({
				code: 'custom',
				message: `endpoint key ${endpoint.key} is duplicated for provider ${endpoint.providerId ?? '<none>'}`,
				path: ['endpoints', index, 'key'],
			});
		} else {
			endpointKeys.set(key, index);
		}
	}

	for (const [index, provider] of bundle.providers.entries()) {
		for (const endpointId of provider.endpoints ?? []) {
			const endpoint = endpoints.get(endpointId);
			if (!endpoint) addReferenceIssue(context, ['providers', index, 'endpoints'], 'endpoint', endpointId);
			else if (endpoint.providerId && endpoint.providerId !== provider.id) {
				context.addIssue({
					code: 'custom',
					message: `endpoint ${endpointId} belongs to provider ${endpoint.providerId}`,
					path: ['providers', index, 'endpoints'],
				});
			}
		}
		if (provider.defaultEndpointId) {
			const endpoint = endpoints.get(provider.defaultEndpointId);
			if (!endpoint) {
				addReferenceIssue(context, ['providers', index, 'defaultEndpointId'], 'endpoint', provider.defaultEndpointId);
			} else if (endpoint.providerId && endpoint.providerId !== provider.id) {
				context.addIssue({
					code: 'custom',
					message: `endpoint ${endpoint.id} belongs to provider ${endpoint.providerId}`,
					path: ['providers', index, 'defaultEndpointId'],
				});
			}
		}
		if (provider.defaultModelId) {
			const model = models.get(provider.defaultModelId);
			if (!model) addReferenceIssue(context, ['providers', index, 'defaultModelId'], 'model', provider.defaultModelId);
			else if (model.providerId && model.providerId !== provider.id) {
				context.addIssue({
					code: 'custom',
					message: `model ${model.id} belongs to provider ${model.providerId}`,
					path: ['providers', index, 'defaultModelId'],
				});
			}
		}
	}

	for (const [index, model] of bundle.models.entries()) {
		const provider = model.providerId ? providers.get(model.providerId) : undefined;
		if (model.providerId && !provider) {
			addReferenceIssue(context, ['models', index, 'providerId'], 'provider', model.providerId);
		}
		const resolution = resolveEndpointForModel(bundle.endpoints, model);
		if (model.endpointId && resolution.status === 'unknown') {
			addReferenceIssue(context, ['models', index, 'endpointId'], 'endpoint', model.endpointId);
		} else if (model.endpointKey && resolution.status === 'unknown') {
			addReferenceIssue(context, ['models', index, 'endpointKey'], 'endpoint key', model.endpointKey);
		} else if (resolution.status === 'ambiguous') {
			context.addIssue({
				code: 'custom',
				message: `endpointKey ${model.endpointKey} is ambiguous`,
				path: ['models', index, 'endpointKey'],
			});
		} else if (
			resolution.status === 'matched' &&
			model.providerId &&
			resolution.endpoint.providerId &&
			resolution.endpoint.providerId !== model.providerId
		) {
			context.addIssue({
				code: 'custom',
				message: `endpoint ${resolution.endpoint.id} belongs to provider ${resolution.endpoint.providerId}`,
				path: ['models', index, model.endpointId ? 'endpointId' : 'endpointKey'],
			});
		}
	}

	for (const [index, service] of bundle.services.entries()) {
		if (service.providerId && !providers.has(service.providerId)) {
			addReferenceIssue(context, ['services', index, 'providerId'], 'provider', service.providerId);
		}
		for (const endpointId of service.endpoints ?? []) {
			const endpoint = endpoints.get(endpointId);
			if (!endpoint) addReferenceIssue(context, ['services', index, 'endpoints'], 'endpoint', endpointId);
			else if (service.providerId && endpoint.providerId && endpoint.providerId !== service.providerId) {
				context.addIssue({
					code: 'custom',
					message: `endpoint ${endpoint.id} belongs to provider ${endpoint.providerId}`,
					path: ['services', index, 'endpoints'],
				});
			}
		}
		const endpointField = service.defaultEndpointId
			? 'defaultEndpointId'
			: service.endpointKey
				? 'endpointKey'
				: undefined;
		if (endpointField) {
			const resolution = resolveEndpointForService(bundle.endpoints, service);
			if (resolution.status === 'unknown') {
				addReferenceIssue(
					context,
					['services', index, endpointField],
					endpointField === 'endpointKey' ? 'endpoint key' : 'endpoint',
					service[endpointField]!,
				);
			} else if (resolution.status === 'ambiguous') {
				context.addIssue({
					code: 'custom',
					message: `endpointKey ${service.endpointKey} is ambiguous`,
					path: ['services', index, 'endpointKey'],
				});
			} else if (
				service.providerId &&
				resolution.endpoint.providerId &&
				resolution.endpoint.providerId !== service.providerId
			) {
				context.addIssue({
					code: 'custom',
					message: `endpoint ${resolution.endpoint.id} belongs to provider ${resolution.endpoint.providerId}`,
					path: ['services', index, endpointField],
				});
			}
		}
	}

	const defaults = bundle.defaults;
	if (defaults?.providerId && !providers.has(defaults.providerId)) {
		addReferenceIssue(context, ['defaults', 'providerId'], 'provider', defaults.providerId);
	}
	if (defaults?.endpointId && !endpoints.has(defaults.endpointId)) {
		addReferenceIssue(context, ['defaults', 'endpointId'], 'endpoint', defaults.endpointId);
	}
	if (defaults?.modelId && !models.has(defaults.modelId)) {
		addReferenceIssue(context, ['defaults', 'modelId'], 'model', defaults.modelId);
	}
	if (defaults?.providerId && defaults.endpointId) {
		const endpoint = endpoints.get(defaults.endpointId);
		if (endpoint?.providerId && endpoint.providerId !== defaults.providerId) {
			context.addIssue({
				code: 'custom',
				message: `endpoint ${endpoint.id} belongs to provider ${endpoint.providerId}`,
				path: ['defaults', 'endpointId'],
			});
		}
	}
	if (defaults?.providerId && defaults.modelId) {
		const model = models.get(defaults.modelId);
		if (model?.providerId && model.providerId !== defaults.providerId) {
			context.addIssue({
				code: 'custom',
				message: `model ${model.id} belongs to provider ${model.providerId}`,
				path: ['defaults', 'modelId'],
			});
		}
	}
	for (const serviceId of defaults?.serviceIds ?? []) {
		if (!services.has(serviceId)) addReferenceIssue(context, ['defaults', 'serviceIds'], 'service', serviceId);
	}
});

export const AiConfigSchema = AiConfigBundleSchema;
export type AiConfigBundle = z.infer<typeof AiConfigBundleSchema>;
export type AiConfig = AiConfigBundle;

export const AiConfigBundleCompatibilityInputSchema = z
	.strictObject({
		schemaVersion: z.number().int().positive().default(1),
		version: z.string().min(1).optional(),
		providers: z.array(ProviderCompatibilityInputSchema).default([]),
		endpoints: z.array(EndpointCompatibilityInputSchema).default([]),
		models: z.array(ModelCompatibilityInputSchema).default([]),
		services: z.array(ServiceCompatibilityInputSchema).default([]),
		defaults: AiConfigDefaultsSchema.optional(),
		metadata: ConfigValueMapSchema.optional(),
		extensions: ConfigExtensionsSchema.optional(),
	})
	.transform((bundle): z.input<typeof AiConfigBundleSchema> => bundle)
	.pipe(AiConfigBundleSchema);
export type AiConfigBundleCompatibilityInput = z.input<typeof AiConfigBundleCompatibilityInputSchema>;

export function normalizeAiConfigBundle(input: AiConfigBundleCompatibilityInput): AiConfigBundle {
	return AiConfigBundleCompatibilityInputSchema.parse(input);
}

export type EndpointReferenceResolution =
	| Readonly<{ status: 'matched'; endpoint: Endpoint }>
	| Readonly<{ status: 'unknown' }>
	| Readonly<{ status: 'ambiguous'; endpoints: readonly Endpoint[] }>;
export type ModelEndpointResolution = EndpointReferenceResolution;

export type ResolvedModelConfig = Readonly<{
	model: Model;
	provider: Provider | undefined;
	endpoint: Endpoint | undefined;
}>;

export function resolveEndpointForModel(endpoints: readonly Endpoint[], model: Model): ModelEndpointResolution {
	return resolveEndpointReference(endpoints, model.endpointId, model.endpointKey, model.providerId);
}

export function resolveEndpointForService(
	endpoints: readonly Endpoint[],
	service: Service,
): EndpointReferenceResolution {
	return resolveEndpointReference(endpoints, service.defaultEndpointId, service.endpointKey, service.providerId);
}

function resolveEndpointReference(
	endpoints: readonly Endpoint[],
	endpointId?: string,
	endpointKey?: string,
	providerId?: string,
): EndpointReferenceResolution {
	if (endpointId) {
		const endpoint = endpoints.find((candidate) => candidate.id === endpointId);
		return endpoint ? { status: 'matched', endpoint } : { status: 'unknown' };
	}
	if (!endpointKey) return { status: 'unknown' };
	const matched = endpoints.filter(
		(endpoint) =>
			(!providerId || !endpoint.providerId || endpoint.providerId === providerId) &&
			(endpoint.key === endpointKey || endpoint.id === endpointKey || endpoint.name === endpointKey),
	);
	if (matched.length === 0) return { status: 'unknown' };
	if (matched.length === 1) return { status: 'matched', endpoint: matched[0] };
	return { status: 'ambiguous', endpoints: matched };
}

export function resolveModelConfig(bundle: AiConfigBundle, modelId: string): ResolvedModelConfig | undefined {
	const model = bundle.models.find((candidate) => candidate.id === modelId);
	if (!model) return undefined;
	const endpoint = resolveEndpointForModel(bundle.endpoints, model);
	return {
		model,
		provider: model.providerId ? bundle.providers.find((candidate) => candidate.id === model.providerId) : undefined,
		endpoint: endpoint.status === 'matched' ? endpoint.endpoint : undefined,
	};
}

export function validateAiConfigBundle(input: unknown): ReturnType<typeof AiConfigBundleSchema.safeParse> {
	return AiConfigBundleSchema.safeParse(input);
}

function identityMap<T extends { id: string }>(
	items: readonly T[],
	path: string,
	context: z.core.$RefinementCtx<unknown>,
): Map<string, T> {
	const values = new Map<string, T>();
	for (const [index, item] of items.entries()) {
		if (values.has(item.id)) {
			context.addIssue({ code: 'custom', message: `duplicate identity ${item.id}`, path: [path, index, 'id'] });
		} else {
			values.set(item.id, item);
		}
	}
	return values;
}

function addReferenceIssue(
	context: z.core.$RefinementCtx<unknown>,
	path: PropertyKey[],
	resource: string,
	identity: string,
): void {
	context.addIssue({ code: 'custom', message: `unknown ${resource} ${identity}`, path });
}
