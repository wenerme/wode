import {
	AnthropicApiFamily,
	AnthropicMessagesApiType,
	ApiFamilyNames,
	ApiTypeNames,
	BedrockConverseApiType,
	BuiltInApiTypes,
	createApiRegistry,
	createSuffixEndpointMatcher,
	DefaultApiRegistry,
	defineApiFamily,
	defineApiOperation,
	defineApiType,
	GoogleGenerativeAIApiType,
	ModelCapabilityNames,
	OpenAIApiFamily,
	OpenAIChatCompletionsApiType,
	OpenAIResponsesApiType,
	parseApiEndpoint,
	resolveApiTypeName,
} from '@wener/ai/schema';
import { describe, expect, test } from 'vite-plus/test';

function matched(path: string) {
	const result = parseApiEndpoint(path);
	expect(result.status).toBe('matched');
	if (result.status !== 'matched') throw new Error(`expected matched endpoint: ${path}`);
	return result.endpoint;
}

describe('API definitions and registry', () => {
	test('uses name-first frozen definitions and family objects', () => {
		expect(OpenAIApiFamily.name).toBe(ApiFamilyNames.openai);
		expect(OpenAIChatCompletionsApiType.name).toBe(ApiTypeNames.openaiChatCompletions);
		expect(OpenAIChatCompletionsApiType.family.name).toBe(OpenAIApiFamily.name);
		expect(OpenAIResponsesApiType.family.name).toBe(OpenAIApiFamily.name);
		expect(AnthropicMessagesApiType.family.name).toBe(AnthropicApiFamily.name);
		expect(BedrockConverseApiType.name).toBe(ApiTypeNames.bedrockConverse);
		expect(GoogleGenerativeAIApiType.name).toBe(ApiTypeNames.googleGenerativeAI);
		expect('id' in OpenAIApiFamily).toBe(false);
		expect('id' in OpenAIChatCompletionsApiType).toBe(false);
		expect('operation' in OpenAIChatCompletionsApiType.operations[0]).toBe(false);
	});

	test('definitions detach and deeply freeze mutable input', () => {
		const source = {
			name: 'custom/run',
			matcher: { kind: 'suffix' as const, segments: ['custom', 'run'] },
		};
		const operation = defineApiOperation(source);
		source.name = 'mutated';
		source.matcher.segments.push('mutated');

		expect(operation.name).toBe('custom/run');
		expect(operation.matcher).toEqual({ kind: 'suffix', segments: ['custom', 'run'] });
		expect(Object.isFrozen(operation)).toBe(true);
		expect(Object.isFrozen(operation.matcher)).toBe(true);
		expect(Object.isFrozen(operation.matcher.kind === 'suffix' ? operation.matcher.segments : [])).toBe(true);
	});

	test('resolves canonical names and aliases', () => {
		expect(resolveApiTypeName('bedrock-converse-stream')).toBe(ApiTypeNames.bedrockConverse);
		expect(DefaultApiRegistry.resolveApiType('bedrock-converse-stream')).toBe(
			DefaultApiRegistry.resolveApiType(ApiTypeNames.bedrockConverse),
		);
		expect(resolveApiTypeName('openai-responses-compact')).toBeUndefined();
	});

	test('rejects canonical and alias collisions', () => {
		const duplicate = defineApiType({
			name: 'custom-api',
			family: OpenAIApiFamily,
			capability: ModelCapabilityNames.messageGeneration,
			aliases: [ApiTypeNames.openaiResponses],
			operations: [defineApiOperation({ name: 'custom', matcher: createSuffixEndpointMatcher('custom') })],
		});
		expect(() => DefaultApiRegistry.extend({ apiTypes: [duplicate] })).toThrow(/collision.*openai-responses/iu);
		expect(() => createApiRegistry({ apiTypes: [duplicate] })).toThrow(/unknown family/iu);
	});

	test('extends without mutating the source registry', () => {
		const custom = defineApiType({
			name: 'custom-run',
			family: OpenAIApiFamily,
			capability: ModelCapabilityNames.messageGeneration,
			operations: [defineApiOperation({ name: 'custom/run', matcher: createSuffixEndpointMatcher('custom/run') })],
		});
		const extended = DefaultApiRegistry.extend({ apiTypes: [custom] });

		expect(DefaultApiRegistry.resolveApiType('custom-run')).toBeUndefined();
		expect(DefaultApiRegistry.parseEndpoint('/v1/custom/run').status).toBe('unknown');
		expect(extended.resolveApiType('custom-run')?.name).toBe('custom-run');
		expect(extended.parseEndpoint('/v1/custom/run').status).toBe('matched');
		expect(DefaultApiRegistry.apiTypes).toHaveLength(BuiltInApiTypes.length);
		expect(Object.isFrozen(extended.apiTypes)).toBe(true);
	});

	test('reports ambiguity rather than selecting by declaration order', () => {
		const operation = defineApiOperation({ name: 'shared/run', matcher: createSuffixEndpointMatcher('shared/run') });
		const registry = DefaultApiRegistry.extend({
			apiTypes: [
				defineApiType({
					name: 'custom-a',
					family: OpenAIApiFamily,
					capability: ModelCapabilityNames.messageGeneration,
					operations: [operation],
				}),
				defineApiType({
					name: 'custom-b',
					family: AnthropicApiFamily,
					capability: ModelCapabilityNames.messageGeneration,
					operations: [operation],
				}),
			],
		});

		const result = registry.parseEndpoint('/v1/shared/run');
		expect(result.status).toBe('ambiguous');
		if (result.status !== 'ambiguous') throw new Error('expected ambiguous endpoint');
		expect(result.candidates.map(({ apiType }) => apiType)).toEqual(['custom-a', 'custom-b']);
		expect(Object.isFrozen(result.candidates)).toBe(true);
	});

	test('rejects a type whose family definition is absent from its explicit registry', () => {
		const detachedFamily = defineApiFamily({ name: 'detached' });
		const detachedType = defineApiType({
			name: 'detached-run',
			family: detachedFamily,
			capability: ModelCapabilityNames.messageGeneration,
			operations: [defineApiOperation({ name: 'run', matcher: createSuffixEndpointMatcher('run') })],
		});
		expect(() => createApiRegistry({ apiTypes: [detachedType] })).toThrow(/unknown family detached/iu);
	});
});

describe('FusionKit-compatible endpoint matrix', () => {
	test.each([
		['/v1/chat/completions', ApiTypeNames.openaiChatCompletions, 'v1', '', 'chat/completions', '', undefined],
		[
			'/api/open-apis/v1/completions',
			ApiTypeNames.openaiCompletions,
			'v1',
			'api/open-apis',
			'completions',
			'',
			undefined,
		],
		[
			'https://example.test/openai/v1/responses?stream=true#ignored',
			ApiTypeNames.openaiResponses,
			'v1',
			'openai',
			'responses',
			'',
			undefined,
		],
		[
			'/codex/v1/responses/compact',
			ApiTypeNames.openaiResponseCompact,
			'v1',
			'codex',
			'responses/compact',
			'',
			undefined,
		],
		['/v2/embeddings', ApiTypeNames.openaiEmbeddings, 'v2', '', 'embeddings', '', undefined],
		['/v1/images/generations', ApiTypeNames.openaiImageGenerations, 'v1', '', 'images/generations', '', undefined],
		['/v1/images/edits', ApiTypeNames.openaiImageEdits, 'v1', '', 'images/edits', '', undefined],
		['/api/anthropic/v1/messages', ApiTypeNames.anthropicMessages, 'v1', 'api/anthropic', 'messages', '', undefined],
		[
			'/anthropic/v1/messages/count_tokens',
			ApiTypeNames.anthropicMessagesCountTokens,
			'v1',
			'anthropic',
			'messages/count_tokens',
			'',
			undefined,
		],
		[
			'/openai/v1/responses/input_tokens',
			ApiTypeNames.openaiResponsesInputTokens,
			'v1',
			'openai',
			'responses/input_tokens',
			'',
			undefined,
		],
	] as const)('parses suffix endpoint %s', (path, apiType, version, prefix, operation, model, streaming) => {
		expect(matched(path)).toMatchObject({ apiType, version, prefix, operation, model, streaming });
	});

	test.each([
		['/model/example.model/invoke', ApiTypeNames.bedrockInvoke, 'invoke', 'example.model', false],
		[
			'/model/global.example.model/invoke-with-response-stream',
			ApiTypeNames.bedrockInvoke,
			'invoke-with-response-stream',
			'global.example.model',
			true,
		],
		['/model/example.model/converse', ApiTypeNames.bedrockConverse, 'converse', 'example.model', false],
		['/model/example.model/converse-stream', ApiTypeNames.bedrockConverse, 'converse-stream', 'example.model', true],
	] as const)('parses Bedrock endpoint %s', (path, apiType, operation, model, streaming) => {
		expect(matched(path)).toMatchObject({ apiType, operation, model, streaming, version: '', prefix: '' });
	});

	test.each([
		[
			'/v1beta/models/example-model:generateContent',
			ApiTypeNames.googleGenerativeAI,
			'v1beta',
			'generateContent',
			false,
		],
		[
			'/v1beta/models/example-model:streamGenerateContent',
			ApiTypeNames.googleGenerativeAI,
			'v1beta',
			'streamGenerateContent',
			true,
		],
		[
			'/v1/projects/example-project/locations/global/publishers/google/models/example-model:generateContent',
			ApiTypeNames.googleVertex,
			'v1',
			'generateContent',
			false,
		],
		[
			'/v1/projects/example-project/locations/global/publishers/google/models/example-model:streamGenerateContent',
			ApiTypeNames.googleVertex,
			'v1',
			'streamGenerateContent',
			true,
		],
	] as const)('parses Google endpoint %s', (path, apiType, version, operation, streaming) => {
		expect(matched(path)).toMatchObject({ apiType, version, operation, model: 'example-model', streaming });
	});

	test('preserves normalized raw paths while stripping URL query and hash', () => {
		expect(matched('https://example.test/api/v1/responses?trace=1#fragment').raw).toBe('/api/v1/responses');
	});

	test.each([
		'/v1beta/models/example-model:generateContent/trailing',
		'/v1/projects/example-project/locations/global/publishers/google/models/example-model:streamGenerateContent/trailing',
	])('requires Google models/<model>:operation to be the final path segment: %s', (path) => {
		expect(parseApiEndpoint(path)).toEqual({ status: 'unknown', raw: path });
	});

	test.each([
		'/v1/tokenize',
		'/v1/rerank',
		'/v1/projects/example-project/locations/global/cachedContents',
		'/v1/projects/example-project/locations/global/publishers/anthropic/models/example:streamRawPredict',
		'/public/index.html',
	])('leaves unsupported path unknown: %s', (path) => {
		expect(parseApiEndpoint(path)).toEqual({ status: 'unknown', raw: path });
	});
});
