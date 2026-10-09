import type { EnumValues } from './types';

export const ApiType = Object.freeze({
	__proto__: null,
	OpenAIChatCompletions: 'openai-chat-completions',
	OpenAICompletions: 'openai-completions',
	OpenAIResponses: 'openai-responses',
	OpenAIResponseCompact: 'openai-response-compact',
	OpenAIModels: 'openai-models',
	OpenAIEmbeddings: 'openai-embeddings',
	OpenAIImageGenerations: 'openai-image-generations',
	OpenAIImageEdits: 'openai-image-edits',
	OpenAIFiles: 'openai-files',
	OpenAIUploads: 'openai-uploads',
	OpenAIBatches: 'openai-batches',
	OpenAIAudioSpeech: 'openai-audio-speech',
	OpenAIAudioTranscriptions: 'openai-audio-transcriptions',
	SDAPITxt2Img: 'sdapi-txt2img',
	SDAPIImg2Img: 'sdapi-img2img',
	Rerank: 'rerank',
	AnthropicMessages: 'anthropic-messages',
	AnthropicMessagesCountTokens: 'anthropic-messages-count-tokens',
	AnthropicMessagesBatches: 'anthropic-messages-batches',
	OpenAIResponsesInputTokens: 'openai-responses-input-tokens',
	BedrockConverse: 'bedrock-converse',
	BedrockInvoke: 'bedrock-invoke',
	GoogleGenerativeAI: 'google-generative-ai',
	GoogleGenerativeAIEmbeddings: 'google-generative-ai-embeddings',
	GoogleGenerativeAICountTokens: 'google-generative-ai-count-tokens',
	GoogleGenerativeAICachedContents: 'google-generative-ai-cached-contents',
	GoogleVertex: 'google-vertex',
	GoogleVertexAnthropicMessages: 'google-vertex-anthropic-messages',
	GoogleVertexAnthropicMessagesCountTokens: 'google-vertex-anthropic-messages-count-tokens',
	/** System One Decision 线协议；Jev 是使用该协议的模型。 */
	SystemOneDecision: 'systemone-decision',
} as const);
export type ApiType = EnumValues<typeof ApiType>;

const RetiredApiTypeAliases = new Set(['responses', 'openai', 'openai-chat']);

/**
 * 仍被接受的旧 API 值 → 规范值。与 {@link isRetiredApiTypeAlias} 不同，这些旧值可能已写入 Provider 配置、
 * `endpoints` key 与历史用量记录，读取时归一化，新写入只用规范值。
 */
const LegacyApiTypeAliases: ReadonlyMap<string, ApiType> = new Map<string, ApiType>([
	// Go 侧定义的旧别名。
	['bedrock-converse-stream', ApiType.BedrockConverse],
]);

/** 把仍兼容的旧值映射为规范 ApiType；其它值原样返回（不做合法性校验）。 */
export function normalizeApiType(value: string): string {
	return LegacyApiTypeAliases.get(value) ?? value;
}

/** 返回与规范 ApiType 等价的旧值，用于读取仍以旧 key 保存的配置（如 Provider `endpoints`）。 */
export function getLegacyApiTypeAliases(api: string): string[] {
	return [...LegacyApiTypeAliases].filter(([, canonical]) => canonical === api).map(([alias]) => alias);
}

/** 历史别名不再作为模型 API 配置的有效值。 */
export function isRetiredApiTypeAlias(value: string): boolean {
	return RetiredApiTypeAliases.has(value);
}
