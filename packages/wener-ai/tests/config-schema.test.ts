import {
	type AiConfigBundle,
	type AiConfigBundleCompatibilityInput,
	AiConfigBundleCompatibilityInputSchema,
	AiConfigBundleSchema,
	EndpointCompatibilityInputSchema,
	EndpointSchema,
	isConfigEnabled,
	ModelCapabilitiesCompatibilityInputSchema,
	ModelCompatibilityInputSchema,
	ModelCostCompatibilityInputSchema,
	ModelDefaultsCompatibilityInputSchema,
	ModelSchema,
	normalizeAiConfigBundle,
	normalizeEndpoint,
	normalizeModel,
	normalizeProvider,
	normalizeService,
	ProviderCompatibilityInputSchema,
	ProviderSchema,
	resolveModelConfig,
	ServiceCompatibilityInputSchema,
	ServiceSchema,
	validateAiConfigBundle,
} from '@wener/ai/schema';
import { describe, expect, test } from 'vite-plus/test';

const canonicalBundle = {
	schemaVersion: 1,
	version: 'demo-v1',
	providers: [
		{
			id: 'provider-example',
			name: 'example',
			type: 'provider',
			apiType: 'openai-chat-completions',
			baseUrl: 'https://api.example.test/v1',
			apiKey: 'plain-example-key',
			headers: { 'X-Example': 'plain-header-value' },
			env: { EXAMPLE_TOKEN: 'plain-env-value' },
			credentials: { account: 'example-account', secret: 'plain-credential' },
			endpoints: ['endpoint-chat'],
			defaultEndpointId: 'endpoint-chat',
			defaultModelId: 'model-chat',
			tags: ['example'],
			labels: { tier: 'development' },
			options: { retries: 2 },
			extensions: { 'example.dev/custom': true },
			enabled: true,
		},
	],
	endpoints: [
		{
			id: 'endpoint-chat',
			name: 'chat',
			key: 'chat',
			providerId: 'provider-example',
			apiType: 'openai-chat-completions',
			baseUrl: 'https://api.example.test/v1/chat/completions',
			headers: { Authorization: 'Bearer plain-example-key' },
			options: { proxy: false },
			extensions: { transportHint: 'fetch' },
			enabled: true,
		},
	],
	models: [
		{
			id: 'model-chat',
			name: 'example-chat',
			providerId: 'provider-example',
			endpointKey: 'chat',
			type: 'chat',
			apiType: 'openai-chat-completions',
			contextWindow: 128_000,
			capabilities: {
				reasoning: true,
				toolCall: true,
				structuredOutput: true,
				extensions: { cachedPrompt: true },
			},
			modalities: { input: ['text', 'image'], output: ['text'] },
			limits: { context: 128_000, output: 16_384 },
			cost: { input: 1, output: 2, cacheRead: 0.2, currency: 'USD', unit: 'million-token' },
			defaults: { temperature: 0.2, topP: 0.9, maxTokens: 4096 },
			status: 'active',
			releaseDate: '2026-01-01',
			openWeights: false,
			options: { reasoningEffort: 'medium' },
			extensions: { source: 'manual' },
			enabled: true,
		},
	],
	services: [
		{
			id: 'service-agent',
			name: 'agent-service',
			type: 'agent',
			apiType: 'http-json',
			baseUrl: 'https://service.example.test',
			providerId: 'provider-example',
			endpoints: ['endpoint-chat'],
			defaultEndpointId: 'endpoint-chat',
			auth: { type: 'bearer', token: 'plain-service-token' },
			credentials: { clientId: 'example-client' },
			capabilities: ['chat', 'tools'],
			tags: ['agent'],
			labels: { owner: 'example-team' },
			options: { timeoutMs: 10_000 },
			extensions: { 'example.dev/service': 1 },
			enabled: true,
		},
	],
	defaults: {
		providerId: 'provider-example',
		endpointId: 'endpoint-chat',
		modelId: 'model-chat',
		serviceIds: ['service-agent'],
	},
	metadata: { owner: 'example' },
	extensions: { 'example.dev/bundle': true },
} satisfies AiConfigBundle;

function expectSafeParseFailure<Input>(
	schema: { safeParse: (input: Input) => { success: boolean } },
	input: Input,
): void {
	let result: { success: boolean } | undefined;
	expect(() => {
		result = schema.safeParse(input);
	}).not.toThrow();
	expect(result?.success).toBe(false);
}

const compatibilityBundle = {
	...canonicalBundle,
	providers: [
		{
			...canonicalBundle.providers[0],
			apiType: 'canonical-provider-api',
			api: 'legacy-provider-api',
			baseUrl: 'https://canonical-provider.example.test',
			url: 'https://legacy-provider.example.test',
			enabled: false,
			disabled: true,
		},
	],
	endpoints: [
		{
			...canonicalBundle.endpoints[0],
			apiType: 'canonical-endpoint-api',
			api: 'legacy-endpoint-api',
			type: 'oldest-endpoint-api',
			baseUrl: 'https://canonical-endpoint.example.test',
			url: 'https://legacy-endpoint.example.test',
			enabled: true,
			disabled: false,
		},
	],
	models: [
		{
			...canonicalBundle.models[0],
			apiType: 'canonical-model-api',
			api: 'legacy-model-api',
			contextWindow: 100,
			contextSize: 200,
			capabilities: {
				toolCall: false,
				tool_call: true,
				structuredOutput: true,
				structured_output: false,
			},
			limits: { context: 100 },
			limit: { context: 200 },
			cost: { cacheRead: 1, cache_read: 2, cacheWrite: 3, cache_write: 4 },
			defaults: { topP: 0.1, top_p: 0.9, maxTokens: 100, max_tokens: 200 },
			releaseDate: 'canonical-date',
			release_date: 'legacy-date',
			openWeights: false,
			open_weights: true,
			enabled: false,
			disabled: true,
		},
	],
	services: [
		{
			...canonicalBundle.services[0],
			type: 'agent',
			apiType: 'canonical-service-api',
			api: 'legacy-service-api',
			baseUrl: 'https://canonical-service.example.test',
			url: 'https://legacy-service.example.test',
			enabled: false,
			disabled: true,
		},
	],
} satisfies AiConfigBundleCompatibilityInput;

describe('canonical AI configuration schemas', () => {
	test('round-trips canonical JSON and plaintext configuration', () => {
		const parsed = AiConfigBundleSchema.parse(JSON.parse(JSON.stringify(canonicalBundle)));
		expect(parsed).toEqual(canonicalBundle);
		expect(JSON.parse(JSON.stringify(parsed))).toEqual(canonicalBundle);
		expect(parsed.providers[0].credentials?.secret).toBe('plain-credential');
		expect(parsed.endpoints[0].headers?.Authorization).toBe('Bearer plain-example-key');
	});

	test('keeps canonical resources independently editable and rejects aliases', () => {
		expect(ProviderSchema.safeParse(canonicalBundle.providers[0]).success).toBe(true);
		expect(EndpointSchema.safeParse(canonicalBundle.endpoints[0]).success).toBe(true);
		expect(ModelSchema.safeParse(canonicalBundle.models[0]).success).toBe(true);
		expect(ServiceSchema.safeParse(canonicalBundle.services[0]).success).toBe(true);
		expect(ProviderSchema.safeParse({ ...canonicalBundle.providers[0], api: 'legacy' }).success).toBe(false);
		expect(
			EndpointSchema.safeParse({ ...canonicalBundle.endpoints[0], url: 'https://legacy.example.test' }).success,
		).toBe(false);
		expect(ModelSchema.safeParse({ ...canonicalBundle.models[0], contextSize: 1 }).success).toBe(false);
		expect(ServiceSchema.safeParse({ ...canonicalBundle.services[0], disabled: false }).success).toBe(false);
	});

	test('normalizes aliases with explicit canonical precedence and no duplicate keys', () => {
		const parsed = normalizeAiConfigBundle(compatibilityBundle);
		const provider = parsed.providers[0];
		const endpoint = parsed.endpoints[0];
		const model = parsed.models[0];
		const service = parsed.services[0];

		expect(provider).toMatchObject({
			apiType: 'canonical-provider-api',
			baseUrl: 'https://canonical-provider.example.test',
			enabled: false,
			type: 'provider',
		});
		expect(endpoint).toMatchObject({
			apiType: 'canonical-endpoint-api',
			baseUrl: 'https://canonical-endpoint.example.test',
			enabled: true,
		});
		expect(model).toMatchObject({
			apiType: 'canonical-model-api',
			contextWindow: 100,
			limits: { context: 100 },
			capabilities: { toolCall: false, structuredOutput: true },
			cost: { cacheRead: 1, cacheWrite: 3 },
			defaults: { topP: 0.1, maxTokens: 100 },
			releaseDate: 'canonical-date',
			openWeights: false,
			enabled: false,
		});
		expect(service).toMatchObject({
			type: 'agent',
			apiType: 'canonical-service-api',
			baseUrl: 'https://canonical-service.example.test',
			enabled: false,
		});

		for (const [value, keys] of [
			[provider, ['api', 'url', 'disabled']],
			[endpoint, ['api', 'type', 'url', 'disabled']],
			[model, ['api', 'contextSize', 'limit', 'release_date', 'open_weights', 'disabled']],
			[model.capabilities, ['tool_call', 'structured_output', 'json_schema', 'json_object']],
			[model.cost, ['cache_read', 'cache_write']],
			[model.defaults, ['top_p', 'top_k', 'max_tokens', 'frequency_penalty', 'presence_penalty']],
			[service, ['api', 'url', 'disabled']],
		] as const) {
			for (const key of keys) expect(value).not.toHaveProperty(key);
		}
	});

	test('normalizes each compatibility resource independently', () => {
		expect(normalizeProvider(compatibilityBundle.providers[0]).apiType).toBe('canonical-provider-api');
		expect(normalizeEndpoint(compatibilityBundle.endpoints[0]).baseUrl).toContain('canonical-endpoint');
		expect(normalizeModel(compatibilityBundle.models[0]).defaults?.maxTokens).toBe(100);
		expect(normalizeService(compatibilityBundle.services[0]).type).toBe('agent');

		const explicitNull = normalizeModel({
			id: 'nullable-model',
			name: 'nullable-model',
			capabilities: { toolCall: null, tool_call: true },
			cost: { cacheRead: null, cache_read: 2 },
			defaults: { topP: null, top_p: 0.9 },
		});
		expect(explicitNull.capabilities?.toolCall).toBeNull();
		expect(explicitNull.cost?.cacheRead).toBeNull();
		expect(explicitNull.defaults?.topP).toBeNull();
	});

	test('resolves model bindings by stable provider and endpoint identity', () => {
		const parsed = AiConfigBundleSchema.parse(canonicalBundle);
		const resolved = resolveModelConfig(parsed, 'model-chat');
		expect(resolved?.provider?.id).toBe('provider-example');
		expect(resolved?.endpoint?.id).toBe('endpoint-chat');
		expect(resolveModelConfig(parsed, 'missing')).toBeUndefined();
	});

	test('rejects simultaneous model endpoint identity and key in canonical and compatibility schemas', () => {
		const input = {
			id: 'model-conflicting-endpoint',
			name: 'model-conflicting-endpoint',
			endpointId: 'endpoint-chat',
			endpointKey: 'chat',
		};
		expectSafeParseFailure(ModelSchema, input);
		expectSafeParseFailure(ModelCompatibilityInputSchema, input);
	});

	test('resolves Service endpointKey and rejects conflicting, missing, or ambiguous references', () => {
		const service = canonicalBundle.services[0];
		expectSafeParseFailure(ServiceSchema, { ...service, endpointKey: 'chat' });
		expectSafeParseFailure(ServiceCompatibilityInputSchema, { ...service, endpointKey: 'chat' });

		const byKey = {
			...canonicalBundle,
			services: [{ ...service, defaultEndpointId: undefined, endpointKey: 'chat' }],
		};
		expect(AiConfigBundleSchema.safeParse(byKey).success).toBe(true);
		expect(
			AiConfigBundleSchema.safeParse({
				...byKey,
				services: [{ ...byKey.services[0], endpointKey: 'missing' }],
			}).success,
		).toBe(false);

		const ambiguous = {
			...byKey,
			endpoints: [...canonicalBundle.endpoints, { id: 'endpoint-shared', name: 'shared', key: 'chat', enabled: true }],
			services: [{ ...byKey.services[0], providerId: undefined }],
		};
		expect(AiConfigBundleSchema.safeParse(ambiguous).success).toBe(false);
	});

	test('compatibility safeParse reports canonical refinement failures without throwing', () => {
		expectSafeParseFailure(ProviderCompatibilityInputSchema, {
			id: 'provider-duplicate-endpoints',
			name: 'provider-duplicate-endpoints',
			endpoints: ['endpoint-chat', 'endpoint-chat'],
		});
		expectSafeParseFailure(ServiceCompatibilityInputSchema, {
			id: 'service-without-type',
			name: 'service-without-type',
		});

		const duplicateEndpointBundle = structuredClone(compatibilityBundle);
		duplicateEndpointBundle.endpoints.push(structuredClone(duplicateEndpointBundle.endpoints[0]));
		expectSafeParseFailure(AiConfigBundleCompatibilityInputSchema, duplicateEndpointBundle);

		const brokenBundle = structuredClone(compatibilityBundle);
		brokenBundle.models[0].providerId = 'missing-provider';
		expectSafeParseFailure(AiConfigBundleCompatibilityInputSchema, brokenBundle);
	});

	test('compatibility safeParse rejects invalid nested model values without throwing', () => {
		expectSafeParseFailure(ModelCapabilitiesCompatibilityInputSchema, { tool_call: 'yes' });
		expectSafeParseFailure(ModelCostCompatibilityInputSchema, { cache_read: -1 });
		expectSafeParseFailure(ModelDefaultsCompatibilityInputSchema, { max_tokens: 0 });
		expectSafeParseFailure(ModelCompatibilityInputSchema, {
			id: 'model-invalid-nested',
			name: 'model-invalid-nested',
			capabilities: { tool_call: 'yes' },
		});
		expectSafeParseFailure(EndpointCompatibilityInputSchema, {
			id: 'endpoint-invalid-headers',
			name: 'endpoint-invalid-headers',
			headers: { Authorization: 1 },
		});
	});

	test('rejects duplicate identities and broken references', () => {
		const invalid = structuredClone(canonicalBundle);
		invalid.providers.push(structuredClone(invalid.providers[0]));
		invalid.models[0].providerId = 'missing-provider';
		invalid.services[0].endpoints = ['missing-endpoint'];
		const result = validateAiConfigBundle(invalid);
		expect(result.success).toBe(false);
		if (result.success) throw new Error('expected invalid bundle');
		const messages = result.error.issues.map(({ message }) => message);
		expect(messages).toContain('duplicate identity provider-example');
		expect(messages).toContain('unknown provider missing-provider');
		expect(messages).toContain('unknown endpoint missing-endpoint');
	});

	test('rejects contradictory enabled/disabled compatibility flags', () => {
		const contradiction = { id: 'p', name: 'p', enabled: true, disabled: true };
		expect(ProviderCompatibilityInputSchema.safeParse(contradiction).success).toBe(false);
		expect(EndpointCompatibilityInputSchema.safeParse(contradiction).success).toBe(false);
		expect(ModelCompatibilityInputSchema.safeParse(contradiction).success).toBe(false);
		expect(ServiceCompatibilityInputSchema.safeParse({ ...contradiction, type: 'agent' }).success).toBe(false);
		expect(isConfigEnabled({ disabled: true })).toBe(false);
		expect(isConfigEnabled({ enabled: false })).toBe(false);
		expect(isConfigEnabled({})).toBe(true);
	});
});
