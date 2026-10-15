import { describe, expect, it } from 'vitest';
import { ApiHttpMethod, getApiEndpointDefs, parseApiEndpoint, parseApiTypeFromEndpoint } from './ApiEndpointDef';
import { ApiType, getLegacyApiTypeAliases, normalizeApiType } from './ApiType';
import { ApiFamily, ApiTypeDefs, getApiTypeDef, ModelCapability } from './ApiTypeDef';

const mappings = [
	['openai-chat-completions', 'openai', 'message-generation'],
	['openai-completions', 'openai', 'text-completion'],
	['openai-responses', 'openai', 'message-generation'],
	['openai-response-compact', 'openai', 'message-generation'],
	['openai-models', 'openai', null],
	['openai-embeddings', 'openai', 'embedding'],
	['openai-image-generations', 'openai', 'image-generation'],
	['openai-image-edits', 'openai', 'image-editing'],
	['openai-files', 'openai', null],
	['openai-uploads', 'openai', null],
	['openai-batches', 'openai', null],
	['openai-audio-speech', 'openai', 'audio-generation'],
	['openai-audio-transcriptions', 'openai', 'audio-transcription'],
	['sdapi-txt2img', 'sdapi', 'image-generation'],
	['sdapi-img2img', 'sdapi', 'image-editing'],
	['rerank', 'rerank', 'reranking'],
	['anthropic-messages', 'anthropic', 'message-generation'],
	['anthropic-messages-count-tokens', 'anthropic', 'token-counting'],
	['anthropic-messages-batches', 'anthropic', null],
	['openai-responses-input-tokens', 'openai', 'token-counting'],
	['bedrock-converse', 'bedrock', 'message-generation'],
	['bedrock-invoke', 'bedrock', 'message-generation'],
	['google-generative-ai', 'google', 'message-generation'],
	['google-generative-ai-embeddings', 'google', 'embedding'],
	['google-generative-ai-count-tokens', 'google', 'token-counting'],
	['google-generative-ai-cached-contents', 'google', null],
	['google-vertex', 'google', 'message-generation'],
	['google-vertex-anthropic-messages', 'anthropic', 'message-generation'],
	['google-vertex-anthropic-messages-count-tokens', 'anthropic', 'token-counting'],
	['systemone-decision', 'systemone', 'decision'],
] as const;

describe('ApiTypeDef', () => {
	it('完整覆盖 30 个规范类型且不包含别名', () => {
		const canonical = Object.values(ApiType).filter((value): value is ApiType => value !== null);
		expect(canonical).toHaveLength(30);
		expect(Object.keys(ApiTypeDefs).sort()).toEqual([...canonical].sort());
		expect(mappings.map(([type]) => type).sort()).toEqual([...canonical].sort());
		for (const type of canonical) {
			expect(getApiTypeDef(type)).toBe(ApiTypeDefs[type]);
			expect(ApiTypeDefs[type].title).toMatch(/^[A-Za-z][A-Za-z ]*$/);
		}
	});

	// google-generative-ai-count-tokens 与 systemone-* 先于 Go 侧定义，Go schemas 需要同步补充。
	it.each(mappings)('%s 的家族与能力遵循 Go 定义', (type, family, capability) => {
		expect(getApiTypeDef(type)).toMatchObject({ type, family, capability });
	});

	it('家族与能力枚举值遵循 Go 定义', () => {
		expect(Object.values(ApiFamily)).toEqual([
			'openai',
			'anthropic',
			'bedrock',
			'google',
			'rerank',
			'systemone',
			'sdapi',
		]);
		expect(Object.values(ModelCapability)).toEqual([
			'message-generation',
			'text-completion',
			'embedding',
			'image-generation',
			'image-editing',
			'reranking',
			'token-counting',
			'decision',
			'audio-generation',
			'audio-transcription',
		]);
	});

	it.each([
		'',
		' ',
		'unknown',
		'jev-decision',
		'openai',
		'OpenAIChatCompletions',
		'OPENAI-CHAT-COMPLETIONS',
		' openai-chat-completions',
		'openai-chat-completions ',
		'openai-chat-completions\n',
		'bedrock-invoke-stream',
		'BedrockConverseStream',
		'BEDROCK-CONVERSE-STREAM',
		'bedrock-converse-stream ',
		'constructor',
		'toString',
		'__proto__',
	])('拒绝非精确输入 %j', (value) => {
		expect(getApiTypeDef(value)).toBeUndefined();
	});

	it.each([['bedrock-converse-stream', ApiType.BedrockConverse]] as const)(
		'旧值 %s 归一化为 %s',
		(legacy, canonical) => {
			expect(getApiTypeDef(legacy)).toBe(ApiTypeDefs[canonical]);
			expect(normalizeApiType(legacy)).toBe(canonical);
			expect(getLegacyApiTypeAliases(canonical)).toContain(legacy);
			expect(Object.hasOwn(ApiTypeDefs, legacy)).toBe(false);
		},
	);

	it('normalizeApiType 不改写规范值与未知值', () => {
		for (const value of [ApiType.OpenAIChatCompletions, 'unknown', '__proto__', 'constructor']) {
			expect(normalizeApiType(value)).toBe(value);
		}
		expect(getLegacyApiTypeAliases(ApiType.OpenAIChatCompletions)).toEqual([]);
	});

	it('冻结枚举、注册表及所有定义', () => {
		for (const value of [ApiFamily, ModelCapability, ApiTypeDefs, ...Object.values(ApiTypeDefs)]) {
			expect(Object.isFrozen(value)).toBe(true);
		}
		expect(Reflect.set(ApiTypeDefs, ApiType.Rerank, null)).toBe(false);
		expect(Reflect.set(ApiTypeDefs[ApiType.Rerank], 'title', 'Changed')).toBe(false);
		expect(ApiTypeDefs[ApiType.Rerank].title).toBe('Rerank');
	});

	it('为协议类型登记规范 endpoint path', () => {
		expect(getApiEndpointDefs(ApiType.OpenAIResponses)).toEqual([
			expect.objectContaining({
				type: ApiType.OpenAIResponses,
				path: '/{version}/responses',
				operation: 'responses',
				methods: [ApiHttpMethod.POST],
			}),
		]);
		expect(ApiTypeDefs[ApiType.OpenAIResponses].endpoints).toEqual(getApiEndpointDefs(ApiType.OpenAIResponses));
	});

	it.each([
		[
			'https://api.example.test/proxy/v1/responses?stream=true',
			{ type: ApiType.OpenAIResponses, version: 'v1', prefix: 'proxy', operation: 'responses', model: '' },
		],
		[
			'example.com/openai/chat/completions',
			{ type: ApiType.OpenAIChatCompletions, version: '', prefix: 'openai', operation: 'chat/completions', model: '' },
		],
		[
			'/api/openai/v1/models/gpt%2F4o-mini',
			{
				type: ApiType.OpenAIModels,
				version: 'v1',
				prefix: 'api/openai',
				operation: 'models/retrieve',
				model: 'gpt/4o-mini',
			},
		],
		[
			'/v1/models/gemini-2.5-pro:generateContent',
			{
				type: ApiType.GoogleGenerativeAI,
				version: 'v1',
				prefix: '',
				operation: 'generateContent',
				model: 'gemini-2.5-pro',
			},
		],
		[
			'/v1/projects/p/locations/us-central1/publishers/google/models/gemini-2.5-pro:streamGenerateContent',
			{
				type: ApiType.GoogleVertex,
				version: 'v1',
				prefix: '',
				operation: 'streamGenerateContent',
				model: 'gemini-2.5-pro',
			},
		],
		[
			'/model/anthropic.claude-3-5-sonnet/converse-stream',
			{
				type: ApiType.BedrockConverse,
				version: '',
				prefix: '',
				operation: 'converse-stream',
				model: 'anthropic.claude-3-5-sonnet',
			},
		],
		[
			'https://sd.example.test/sdapi/v1/txt2img?model=local/flux',
			{ type: ApiType.SDAPITxt2Img, version: 'v1', prefix: 'sdapi', operation: 'txt2img', model: '' },
		],
	] as const)('解析 endpoint %s', (input, expected) => {
		expect(parseApiEndpoint(input)).toMatchObject(expected);
		expect(parseApiTypeFromEndpoint(input)).toBe(expected.type);
	});

	it('根据 HTTP method 区分 batch operation', () => {
		expect(parseApiEndpoint('/v1/batches', ApiHttpMethod.POST)).toMatchObject({
			type: ApiType.OpenAIBatches,
			operation: 'batches/create',
		});
		expect(parseApiEndpoint('/v1/batches', ApiHttpMethod.GET)).toMatchObject({
			type: ApiType.OpenAIBatches,
			operation: 'batches/list',
		});
	});

	it('拒绝未登记或 method 不匹配的 endpoint', () => {
		expect(parseApiEndpoint('/v1/unknown', ApiHttpMethod.POST)).toBeUndefined();
		expect(parseApiEndpoint('/v1/responses', ApiHttpMethod.GET)).toBeUndefined();
	});
});
