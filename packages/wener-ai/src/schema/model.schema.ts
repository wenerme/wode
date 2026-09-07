import { z } from 'zod';
import {
	ConfigExtensionsSchema,
	ConfigIdentitySchema,
	ConfigLabelsSchema,
	ConfigStringMapSchema,
	ConfigTagsSchema,
	ConfigValueMapSchema,
	enabledCompatibilityError,
	preferCanonical,
} from './config-common';

const OptionalCapabilitySchema = z.boolean().nullable().optional();
const OptionalNonNegativeSchema = z.number().nonnegative().nullable().optional();
const OptionalPositiveIntegerSchema = z.number().int().positive().nullable().optional();

const ModelCapabilitiesShape = {
	messageGeneration: OptionalCapabilitySchema,
	textCompletion: OptionalCapabilitySchema,
	embedding: OptionalCapabilitySchema,
	imageGeneration: OptionalCapabilitySchema,
	imageEditing: OptionalCapabilitySchema,
	reranking: OptionalCapabilitySchema,
	tokenCounting: OptionalCapabilitySchema,
	reasoning: OptionalCapabilitySchema,
	toolCall: OptionalCapabilitySchema,
	attachment: OptionalCapabilitySchema,
	temperature: OptionalCapabilitySchema,
	structuredOutput: OptionalCapabilitySchema,
	jsonSchema: OptionalCapabilitySchema,
	jsonObject: OptionalCapabilitySchema,
	extensions: ConfigExtensionsSchema.optional(),
};
export const ModelCapabilitiesSchema = z.strictObject(ModelCapabilitiesShape);
export type ModelCapabilities = z.infer<typeof ModelCapabilitiesSchema>;

export const ModelCapabilitiesCompatibilityInputSchema = z
	.strictObject({
		...ModelCapabilitiesShape,
		tool_call: OptionalCapabilitySchema,
		structured_output: OptionalCapabilitySchema,
		json_schema: OptionalCapabilitySchema,
		json_object: OptionalCapabilitySchema,
	})
	.transform(
		({
			tool_call,
			structured_output,
			json_schema,
			json_object,
			...canonical
		}): z.input<typeof ModelCapabilitiesSchema> => ({
			...canonical,
			toolCall: preferCanonical(canonical.toolCall, tool_call),
			structuredOutput: preferCanonical(canonical.structuredOutput, structured_output),
			jsonSchema: preferCanonical(canonical.jsonSchema, json_schema),
			jsonObject: preferCanonical(canonical.jsonObject, json_object),
		}),
	)
	.pipe(ModelCapabilitiesSchema);

export const ModelModalitiesSchema = z.strictObject({
	input: z.array(z.string().min(1)).nullable().optional(),
	output: z.array(z.string().min(1)).nullable().optional(),
	extensions: ConfigExtensionsSchema.optional(),
});
export type ModelModalities = z.infer<typeof ModelModalitiesSchema>;

export const ModelLimitsSchema = z.strictObject({
	context: OptionalPositiveIntegerSchema,
	input: OptionalPositiveIntegerSchema,
	output: OptionalPositiveIntegerSchema,
	requestsPerMinute: OptionalPositiveIntegerSchema,
	tokensPerMinute: OptionalPositiveIntegerSchema,
	extensions: ConfigExtensionsSchema.optional(),
});
export type ModelLimits = z.infer<typeof ModelLimitsSchema>;

const ModelCostShape = {
	input: OptionalNonNegativeSchema,
	output: OptionalNonNegativeSchema,
	cacheRead: OptionalNonNegativeSchema,
	cacheWrite: OptionalNonNegativeSchema,
	reasoning: OptionalNonNegativeSchema,
	currency: z.string().min(1).optional(),
	unit: z.string().min(1).optional(),
	extensions: ConfigExtensionsSchema.optional(),
};
export const ModelCostSchema = z.strictObject(ModelCostShape);
export type ModelCost = z.infer<typeof ModelCostSchema>;

export const ModelCostCompatibilityInputSchema = z
	.strictObject({
		...ModelCostShape,
		cache_read: OptionalNonNegativeSchema,
		cache_write: OptionalNonNegativeSchema,
	})
	.transform(
		({ cache_read, cache_write, ...canonical }): z.input<typeof ModelCostSchema> => ({
			...canonical,
			cacheRead: preferCanonical(canonical.cacheRead, cache_read),
			cacheWrite: preferCanonical(canonical.cacheWrite, cache_write),
		}),
	)
	.pipe(ModelCostSchema);

const ModelDefaultsShape = {
	temperature: z.number().nullable().optional(),
	topP: z.number().nullable().optional(),
	topK: z.number().nullable().optional(),
	maxTokens: z.number().int().positive().nullable().optional(),
	frequencyPenalty: z.number().nullable().optional(),
	presencePenalty: z.number().nullable().optional(),
	extensions: ConfigExtensionsSchema.optional(),
};
export const ModelDefaultsSchema = z.strictObject(ModelDefaultsShape);
export type ModelDefaults = z.infer<typeof ModelDefaultsSchema>;

export const ModelDefaultsCompatibilityInputSchema = z
	.strictObject({
		...ModelDefaultsShape,
		top_p: z.number().nullable().optional(),
		top_k: z.number().nullable().optional(),
		max_tokens: z.number().int().positive().nullable().optional(),
		frequency_penalty: z.number().nullable().optional(),
		presence_penalty: z.number().nullable().optional(),
	})
	.transform(
		({
			top_p,
			top_k,
			max_tokens,
			frequency_penalty,
			presence_penalty,
			...canonical
		}): z.input<typeof ModelDefaultsSchema> => ({
			...canonical,
			topP: preferCanonical(canonical.topP, top_p),
			topK: preferCanonical(canonical.topK, top_k),
			maxTokens: preferCanonical(canonical.maxTokens, max_tokens),
			frequencyPenalty: preferCanonical(canonical.frequencyPenalty, frequency_penalty),
			presencePenalty: preferCanonical(canonical.presencePenalty, presence_penalty),
		}),
	)
	.pipe(ModelDefaultsSchema);

const ModelShape = {
	id: ConfigIdentitySchema,
	name: ConfigIdentitySchema,
	providerId: ConfigIdentitySchema.optional(),
	endpointId: ConfigIdentitySchema.optional(),
	endpointKey: ConfigIdentitySchema.optional(),
	title: z.string().optional(),
	description: z.string().optional(),
	type: z.enum(['chat', 'completion', 'embedding', 'rerank', 'generation', 'image', 'audio', 'video']).optional(),
	family: z.string().min(1).optional(),
	apiType: z.string().min(1).optional(),
	contextWindow: z.number().int().positive().optional(),
	maxInputTokens: z.number().int().positive().optional(),
	maxOutputTokens: z.number().int().positive().optional(),
	capabilities: ModelCapabilitiesSchema.optional(),
	modalities: ModelModalitiesSchema.optional(),
	limits: ModelLimitsSchema.optional(),
	cost: ModelCostSchema.optional(),
	defaults: ModelDefaultsSchema.optional(),
	status: z.enum(['alpha', 'beta', 'active', 'deprecated', 'disabled']).optional(),
	releaseDate: z.string().optional(),
	knowledge: z.string().optional(),
	openWeights: z.boolean().optional(),
	headers: ConfigStringMapSchema.optional(),
	tags: ConfigTagsSchema.optional(),
	labels: ConfigLabelsSchema.optional(),
	options: ConfigValueMapSchema.optional(),
	extensions: ConfigExtensionsSchema.optional(),
	enabled: z.boolean().optional(),
};

export const ModelSchema = z.strictObject(ModelShape).superRefine((value, context) => {
	if (value.endpointId && value.endpointKey) {
		context.addIssue({
			code: 'custom',
			message: 'model accepts endpointId or endpointKey, not both',
			path: ['endpointKey'],
		});
	}
});
export type Model = z.infer<typeof ModelSchema>;

export const ModelCompatibilityInputSchema = z
	.strictObject({
		...ModelShape,
		api: z.string().min(1).optional(),
		contextSize: z.number().int().positive().optional(),
		capabilities: ModelCapabilitiesCompatibilityInputSchema.optional(),
		limit: ModelLimitsSchema.optional(),
		cost: ModelCostCompatibilityInputSchema.optional(),
		defaults: ModelDefaultsCompatibilityInputSchema.optional(),
		release_date: z.string().optional(),
		open_weights: z.boolean().optional(),
		disabled: z.boolean().optional(),
	})
	.superRefine((value, context) => {
		const error = enabledCompatibilityError(value);
		if (error) context.addIssue({ code: 'custom', message: error, path: ['enabled'] });
	})
	.transform(
		({ api, contextSize, limit, release_date, open_weights, disabled, ...canonical }): z.input<typeof ModelSchema> => ({
			...canonical,
			apiType: canonical.apiType ?? api,
			contextWindow: canonical.contextWindow ?? contextSize,
			limits: canonical.limits ?? limit,
			releaseDate: canonical.releaseDate ?? release_date,
			openWeights: canonical.openWeights ?? open_weights,
			enabled: canonical.enabled ?? !(disabled ?? false),
		}),
	)
	.pipe(ModelSchema);
export type ModelCompatibilityInput = z.input<typeof ModelCompatibilityInputSchema>;

export function normalizeModel(input: ModelCompatibilityInput): Model {
	return ModelCompatibilityInputSchema.parse(input);
}
