import type { GenerateMessageCodec } from '../codec';
import { AnthropicMessagesCodec } from './anthropic-messages';
import { GeminiGenerateContentCodec } from './gemini-generate-content';
import { OpenAIChatCompletionsCodec } from './openai-chat-completions';
import { OpenAIResponsesCodec } from './openai-responses';

export * from './anthropic-messages';
export * from './gemini-generate-content';
export * from './openai-chat-completions';
export * from './openai-responses';

/** Codecs registered by default. Vertex variants need their own path and body handling and are not included. */
export const BuiltinGenerateMessageCodecs: readonly GenerateMessageCodec[] = Object.freeze([
	OpenAIChatCompletionsCodec as GenerateMessageCodec,
	OpenAIResponsesCodec as GenerateMessageCodec,
	AnthropicMessagesCodec as GenerateMessageCodec,
	GeminiGenerateContentCodec as GenerateMessageCodec,
]);
