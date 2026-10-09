import { describe, expect, it } from 'vitest';
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
});
