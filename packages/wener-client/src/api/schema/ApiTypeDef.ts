import { type ApiEndpointDef, getApiEndpointDefs } from './ApiEndpointDef';
import { ApiType, normalizeApiType } from './ApiType';
import type { EnumValues } from './types';

export const ApiFamily = Object.freeze({
	__proto__: null,
	OpenAI: 'openai',
	Anthropic: 'anthropic',
	Bedrock: 'bedrock',
	Google: 'google',
	Rerank: 'rerank',
	SystemOne: 'systemone',
	SDAPI: 'sdapi',
} as const);
export type ApiFamily = EnumValues<typeof ApiFamily>;

export const ModelCapability = Object.freeze({
	__proto__: null,
	MessageGeneration: 'message-generation',
	TextCompletion: 'text-completion',
	Embedding: 'embedding',
	ImageGeneration: 'image-generation',
	ImageEditing: 'image-editing',
	Reranking: 'reranking',
	TokenCounting: 'token-counting',
	Decision: 'decision',
	AudioGeneration: 'audio-generation',
	AudioTranscription: 'audio-transcription',
} as const);
export type ModelCapability = EnumValues<typeof ModelCapability>;

export interface ApiTypeDef {
	readonly type: ApiType;
	readonly title: string;
	readonly family: ApiFamily;
	readonly capability: ModelCapability | null;
	readonly endpoints: readonly ApiEndpointDef[];
}

function define(type: ApiType, title: string, family: ApiFamily, capability: ModelCapability | null): ApiTypeDef {
	return Object.freeze({ type, title, family, capability, endpoints: getApiEndpointDefs(type) });
}

export const ApiTypeDefs: Readonly<Record<ApiType, ApiTypeDef>> = Object.freeze({
	[ApiType.OpenAIChatCompletions]: define(
		ApiType.OpenAIChatCompletions,
		'OpenAI Chat Completions',
		ApiFamily.OpenAI,
		ModelCapability.MessageGeneration,
	),
	[ApiType.OpenAICompletions]: define(
		ApiType.OpenAICompletions,
		'OpenAI Completions',
		ApiFamily.OpenAI,
		ModelCapability.TextCompletion,
	),
	[ApiType.OpenAIResponses]: define(
		ApiType.OpenAIResponses,
		'OpenAI Responses',
		ApiFamily.OpenAI,
		ModelCapability.MessageGeneration,
	),
	[ApiType.OpenAIResponseCompact]: define(
		ApiType.OpenAIResponseCompact,
		'OpenAI Responses Compact',
		ApiFamily.OpenAI,
		ModelCapability.MessageGeneration,
	),
	[ApiType.OpenAIModels]: define(ApiType.OpenAIModels, 'OpenAI Models', ApiFamily.OpenAI, null),
	[ApiType.OpenAIEmbeddings]: define(
		ApiType.OpenAIEmbeddings,
		'OpenAI Embeddings',
		ApiFamily.OpenAI,
		ModelCapability.Embedding,
	),
	[ApiType.OpenAIImageGenerations]: define(
		ApiType.OpenAIImageGenerations,
		'OpenAI Images Generations',
		ApiFamily.OpenAI,
		ModelCapability.ImageGeneration,
	),
	[ApiType.OpenAIImageEdits]: define(
		ApiType.OpenAIImageEdits,
		'OpenAI Images Edits',
		ApiFamily.OpenAI,
		ModelCapability.ImageEditing,
	),
	[ApiType.OpenAIFiles]: define(ApiType.OpenAIFiles, 'OpenAI Files', ApiFamily.OpenAI, null),
	[ApiType.OpenAIUploads]: define(ApiType.OpenAIUploads, 'OpenAI Uploads', ApiFamily.OpenAI, null),
	[ApiType.OpenAIBatches]: define(ApiType.OpenAIBatches, 'OpenAI Batches', ApiFamily.OpenAI, null),
	[ApiType.OpenAIAudioSpeech]: define(
		ApiType.OpenAIAudioSpeech,
		'OpenAI Audio Speech',
		ApiFamily.OpenAI,
		ModelCapability.AudioGeneration,
	),
	[ApiType.OpenAIAudioTranscriptions]: define(
		ApiType.OpenAIAudioTranscriptions,
		'OpenAI Audio Transcriptions',
		ApiFamily.OpenAI,
		ModelCapability.AudioTranscription,
	),
	[ApiType.SDAPITxt2Img]: define(
		ApiType.SDAPITxt2Img,
		'SDAPI Text To Image',
		ApiFamily.SDAPI,
		ModelCapability.ImageGeneration,
	),
	[ApiType.SDAPIImg2Img]: define(
		ApiType.SDAPIImg2Img,
		'SDAPI Image To Image',
		ApiFamily.SDAPI,
		ModelCapability.ImageEditing,
	),
	[ApiType.Rerank]: define(ApiType.Rerank, 'Rerank', ApiFamily.Rerank, ModelCapability.Reranking),
	[ApiType.AnthropicMessages]: define(
		ApiType.AnthropicMessages,
		'Anthropic Messages',
		ApiFamily.Anthropic,
		ModelCapability.MessageGeneration,
	),
	[ApiType.AnthropicMessagesCountTokens]: define(
		ApiType.AnthropicMessagesCountTokens,
		'Anthropic Messages Count Tokens',
		ApiFamily.Anthropic,
		ModelCapability.TokenCounting,
	),
	[ApiType.AnthropicMessagesBatches]: define(
		ApiType.AnthropicMessagesBatches,
		'Anthropic Message Batches',
		ApiFamily.Anthropic,
		null,
	),
	[ApiType.OpenAIResponsesInputTokens]: define(
		ApiType.OpenAIResponsesInputTokens,
		'OpenAI Responses Input Tokens',
		ApiFamily.OpenAI,
		ModelCapability.TokenCounting,
	),
	[ApiType.BedrockConverse]: define(
		ApiType.BedrockConverse,
		'Amazon Bedrock Converse',
		ApiFamily.Bedrock,
		ModelCapability.MessageGeneration,
	),
	[ApiType.BedrockInvoke]: define(
		ApiType.BedrockInvoke,
		'Amazon Bedrock InvokeModel',
		ApiFamily.Bedrock,
		ModelCapability.MessageGeneration,
	),
	[ApiType.GoogleGenerativeAI]: define(
		ApiType.GoogleGenerativeAI,
		'Google Generative AI',
		ApiFamily.Google,
		ModelCapability.MessageGeneration,
	),
	[ApiType.GoogleGenerativeAIEmbeddings]: define(
		ApiType.GoogleGenerativeAIEmbeddings,
		'Google Generative AI Embeddings',
		ApiFamily.Google,
		ModelCapability.Embedding,
	),
	[ApiType.GoogleGenerativeAICountTokens]: define(
		ApiType.GoogleGenerativeAICountTokens,
		'Google Generative AI Count Tokens',
		ApiFamily.Google,
		ModelCapability.TokenCounting,
	),
	[ApiType.GoogleGenerativeAICachedContents]: define(
		ApiType.GoogleGenerativeAICachedContents,
		'Google Generative AI Cached Contents',
		ApiFamily.Google,
		null,
	),
	[ApiType.GoogleVertex]: define(
		ApiType.GoogleVertex,
		'Google Vertex AI Gemini GenerateContent',
		ApiFamily.Google,
		ModelCapability.MessageGeneration,
	),
	[ApiType.GoogleVertexAnthropicMessages]: define(
		ApiType.GoogleVertexAnthropicMessages,
		'Google Vertex AI Anthropic Messages',
		ApiFamily.Anthropic,
		ModelCapability.MessageGeneration,
	),
	[ApiType.GoogleVertexAnthropicMessagesCountTokens]: define(
		ApiType.GoogleVertexAnthropicMessagesCountTokens,
		'Google Vertex AI Anthropic Messages Count Tokens',
		ApiFamily.Anthropic,
		ModelCapability.TokenCounting,
	),
	[ApiType.SystemOneDecision]: define(
		ApiType.SystemOneDecision,
		'SystemOne Decision',
		ApiFamily.SystemOne,
		ModelCapability.Decision,
	),
});

export function getApiTypeDef(value: string): ApiTypeDef | undefined {
	// 只接受显式登记的 Go 旧别名，不宽化规范字符串解析。
	const type = normalizeApiType(value);
	return Object.hasOwn(ApiTypeDefs, type) ? ApiTypeDefs[type as ApiType] : undefined;
}
