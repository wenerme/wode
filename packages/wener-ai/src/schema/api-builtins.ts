import { defineApiFamily, defineApiOperation, defineApiType } from './api-definition';
import { createBedrockEndpointMatcher, createGoogleEndpointMatcher, createSuffixEndpointMatcher } from './api-matchers';
import { type ApiEndpointParseResult, type ApiRegistry, createApiRegistry } from './api-registry';

export const ApiFamilyNames = Object.freeze({
	openai: 'openai',
	anthropic: 'anthropic',
	bedrock: 'bedrock',
	google: 'google',
} as const);

export const ApiTypeNames = Object.freeze({
	openaiChatCompletions: 'openai-chat-completions',
	openaiCompletions: 'openai-completions',
	openaiResponses: 'openai-responses',
	openaiResponseCompact: 'openai-response-compact',
	openaiEmbeddings: 'openai-embeddings',
	openaiImageGenerations: 'openai-image-generations',
	openaiImageEdits: 'openai-image-edits',
	anthropicMessages: 'anthropic-messages',
	anthropicMessagesCountTokens: 'anthropic-messages-count-tokens',
	openaiResponsesInputTokens: 'openai-responses-input-tokens',
	bedrockConverse: 'bedrock-converse',
	bedrockInvoke: 'bedrock-invoke',
	googleGenerativeAI: 'google-generative-ai',
	googleVertex: 'google-vertex',
} as const);

export const ModelCapabilityNames = Object.freeze({
	messageGeneration: 'message-generation',
	textCompletion: 'text-completion',
	embedding: 'embedding',
	imageGeneration: 'image-generation',
	imageEditing: 'image-editing',
	reranking: 'reranking',
	tokenCounting: 'token-counting',
} as const);

const suffixOperation = (name: string, streaming?: boolean) =>
	defineApiOperation({ name, matcher: createSuffixEndpointMatcher(name), streaming });

const bedrockOperation = (
	name: 'converse' | 'converse-stream' | 'invoke' | 'invoke-with-response-stream',
	streaming: boolean,
) => defineApiOperation({ name, matcher: createBedrockEndpointMatcher(name), streaming });

const googleOperation = (
	platform: 'generative-ai' | 'vertex',
	name: 'generateContent' | 'streamGenerateContent',
	streaming: boolean,
) => defineApiOperation({ name, matcher: createGoogleEndpointMatcher(platform, name), streaming });

export const OpenAIApiFamily = defineApiFamily({
	name: ApiFamilyNames.openai,
	capabilities: [
		ModelCapabilityNames.messageGeneration,
		ModelCapabilityNames.textCompletion,
		ModelCapabilityNames.embedding,
		ModelCapabilityNames.imageGeneration,
		ModelCapabilityNames.imageEditing,
		ModelCapabilityNames.tokenCounting,
	],
});
export const AnthropicApiFamily = defineApiFamily({
	name: ApiFamilyNames.anthropic,
	capabilities: [ModelCapabilityNames.messageGeneration, ModelCapabilityNames.tokenCounting],
});
export const BedrockApiFamily = defineApiFamily({
	name: ApiFamilyNames.bedrock,
	capabilities: [ModelCapabilityNames.messageGeneration],
});
export const GoogleApiFamily = defineApiFamily({
	name: ApiFamilyNames.google,
	capabilities: [ModelCapabilityNames.messageGeneration],
});

export const OpenAIChatCompletionsApiType = defineApiType({
	name: ApiTypeNames.openaiChatCompletions,
	family: OpenAIApiFamily,
	capability: ModelCapabilityNames.messageGeneration,
	operations: [suffixOperation('chat/completions')],
});
export const OpenAICompletionsApiType = defineApiType({
	name: ApiTypeNames.openaiCompletions,
	family: OpenAIApiFamily,
	capability: ModelCapabilityNames.textCompletion,
	operations: [suffixOperation('completions')],
});
export const OpenAIResponsesApiType = defineApiType({
	name: ApiTypeNames.openaiResponses,
	family: OpenAIApiFamily,
	capability: ModelCapabilityNames.messageGeneration,
	operations: [suffixOperation('responses')],
});
export const OpenAIResponseCompactApiType = defineApiType({
	name: ApiTypeNames.openaiResponseCompact,
	family: OpenAIApiFamily,
	capability: ModelCapabilityNames.messageGeneration,
	operations: [suffixOperation('responses/compact')],
});
export const OpenAIEmbeddingsApiType = defineApiType({
	name: ApiTypeNames.openaiEmbeddings,
	family: OpenAIApiFamily,
	capability: ModelCapabilityNames.embedding,
	operations: [suffixOperation('embeddings')],
});
export const OpenAIImageGenerationsApiType = defineApiType({
	name: ApiTypeNames.openaiImageGenerations,
	family: OpenAIApiFamily,
	capability: ModelCapabilityNames.imageGeneration,
	operations: [suffixOperation('images/generations')],
});
export const OpenAIImageEditsApiType = defineApiType({
	name: ApiTypeNames.openaiImageEdits,
	family: OpenAIApiFamily,
	capability: ModelCapabilityNames.imageEditing,
	operations: [suffixOperation('images/edits')],
});
export const AnthropicMessagesApiType = defineApiType({
	name: ApiTypeNames.anthropicMessages,
	family: AnthropicApiFamily,
	capability: ModelCapabilityNames.messageGeneration,
	operations: [suffixOperation('messages')],
});
export const AnthropicMessagesCountTokensApiType = defineApiType({
	name: ApiTypeNames.anthropicMessagesCountTokens,
	family: AnthropicApiFamily,
	capability: ModelCapabilityNames.tokenCounting,
	operations: [suffixOperation('messages/count_tokens')],
});
export const OpenAIResponsesInputTokensApiType = defineApiType({
	name: ApiTypeNames.openaiResponsesInputTokens,
	family: OpenAIApiFamily,
	capability: ModelCapabilityNames.tokenCounting,
	operations: [suffixOperation('responses/input_tokens')],
});
export const BedrockConverseApiType = defineApiType({
	name: ApiTypeNames.bedrockConverse,
	family: BedrockApiFamily,
	capability: ModelCapabilityNames.messageGeneration,
	aliases: ['bedrock-converse-stream'],
	operations: [bedrockOperation('converse', false), bedrockOperation('converse-stream', true)],
});
export const BedrockInvokeApiType = defineApiType({
	name: ApiTypeNames.bedrockInvoke,
	family: BedrockApiFamily,
	capability: ModelCapabilityNames.messageGeneration,
	operations: [bedrockOperation('invoke', false), bedrockOperation('invoke-with-response-stream', true)],
});
export const GoogleGenerativeAIApiType = defineApiType({
	name: ApiTypeNames.googleGenerativeAI,
	family: GoogleApiFamily,
	capability: ModelCapabilityNames.messageGeneration,
	operations: [
		googleOperation('generative-ai', 'generateContent', false),
		googleOperation('generative-ai', 'streamGenerateContent', true),
	],
});
export const GoogleVertexApiType = defineApiType({
	name: ApiTypeNames.googleVertex,
	family: GoogleApiFamily,
	capability: ModelCapabilityNames.messageGeneration,
	operations: [
		googleOperation('vertex', 'generateContent', false),
		googleOperation('vertex', 'streamGenerateContent', true),
	],
});

export const BuiltInApiFamilies = Object.freeze([
	OpenAIApiFamily,
	AnthropicApiFamily,
	BedrockApiFamily,
	GoogleApiFamily,
]);
export const BuiltInApiTypes = Object.freeze([
	OpenAIChatCompletionsApiType,
	OpenAICompletionsApiType,
	OpenAIResponsesApiType,
	OpenAIResponseCompactApiType,
	OpenAIEmbeddingsApiType,
	OpenAIImageGenerationsApiType,
	OpenAIImageEditsApiType,
	AnthropicMessagesApiType,
	AnthropicMessagesCountTokensApiType,
	OpenAIResponsesInputTokensApiType,
	BedrockConverseApiType,
	BedrockInvokeApiType,
	GoogleGenerativeAIApiType,
	GoogleVertexApiType,
]);

export const DefaultApiRegistry = createApiRegistry({
	families: BuiltInApiFamilies,
	apiTypes: BuiltInApiTypes,
});

export function parseApiEndpoint(
	pathOrUrl: string,
	registry: ApiRegistry = DefaultApiRegistry,
): ApiEndpointParseResult {
	return registry.parseEndpoint(pathOrUrl);
}

export function resolveApiTypeName(
	nameOrAlias: string,
	registry: ApiRegistry = DefaultApiRegistry,
): string | undefined {
	return registry.resolveApiTypeName(nameOrAlias);
}
