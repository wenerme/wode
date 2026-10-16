import { z } from 'zod';
import {
	AnthropicContentBlockSchema,
	AnthropicMessageParamSchema,
	AnthropicMessagesRequestSchema,
	AnthropicMessagesResponseSchema,
	AnthropicMessagesStreamEventSchema,
} from '../../anthropic-messages/schema/AnthropicMessagesSchema';
import {
	GeminiContentSchema,
	GeminiGenerateContentRequestSchema,
	GeminiGenerateContentResponseSchema,
	GeminiPartSchema,
} from '../../gemini-generate-content/schema/GeminiGenerateContentSchema';
import {
	OpenAIChatCompletionsRequestSchema,
	OpenAIChatCompletionsResponseSchema,
	OpenAIChatCompletionsStreamEventSchema,
	OpenAIChatContentPartSchema,
	OpenAIChatMessageSchema,
} from '../../openai-chat-completions/schema/OpenAIChatCompletionsSchema';
import {
	OpenAIResponseContentPartSchema,
	OpenAIResponseInputMessageItemSchema,
	OpenAIResponsesRequestSchema,
	OpenAIResponsesResponseSchema,
	OpenAIResponsesStreamEventSchema,
} from '../../openai-responses/schema/OpenAIResponsesSchema';
import { GenericUsageSchema } from './GenericUsageSchema';

/** 原生 wire 请求的联合，沿用各协议约束，不转换字段或注入默认值。 */
export const GenerateMessageWireRequestSchema = z
	.union([
		OpenAIChatCompletionsRequestSchema,
		OpenAIResponsesRequestSchema,
		AnthropicMessagesRequestSchema,
		GeminiGenerateContentRequestSchema,
	])
	.describe('Message generation request using native protocol fields');

export const GenerateMessageWireResponseSchema = z
	.union([
		OpenAIChatCompletionsResponseSchema,
		OpenAIResponsesResponseSchema,
		AnthropicMessagesResponseSchema,
		GeminiGenerateContentResponseSchema,
	])
	.describe('Message generation response using native protocol fields');

/** Gemini 流的每个事件就是一个 GenerateContent 响应对象。 */
export const GenerateMessageWireStreamEventSchema = z
	.union([
		OpenAIChatCompletionsStreamEventSchema,
		OpenAIResponsesStreamEventSchema,
		AnthropicMessagesStreamEventSchema,
		GeminiGenerateContentResponseSchema,
	])
	.describe('Message generation stream event');

export const GenerateMessageWireSchema = z
	.union([
		OpenAIChatMessageSchema,
		OpenAIResponseInputMessageItemSchema,
		AnthropicMessageParamSchema,
		GeminiContentSchema,
	])
	.describe('Conversation message');

export const GenerateMessageWireContentPartSchema = z
	.union([OpenAIChatContentPartSchema, OpenAIResponseContentPartSchema, AnthropicContentBlockSchema, GeminiPartSchema])
	.describe('Text, media, or tool content part');

export const GenerateMessageWireUsageSchema = GenericUsageSchema;

export type GenerateMessageWireRequest = z.infer<typeof GenerateMessageWireRequestSchema>;
export type GenerateMessageWireResponse = z.infer<typeof GenerateMessageWireResponseSchema>;
export type GenerateMessageWireStreamEvent = z.infer<typeof GenerateMessageWireStreamEventSchema>;
export type GenerateMessageWire = z.infer<typeof GenerateMessageWireSchema>;
export type GenerateMessageWireContentPart = z.infer<typeof GenerateMessageWireContentPartSchema>;
export type GenerateMessageWireUsage = z.infer<typeof GenerateMessageWireUsageSchema>;
