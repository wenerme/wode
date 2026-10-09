import { z } from 'zod';

const wireString = z.string().min(1);
const knownContentTypes = new Set(['text', 'image', 'tool_use', 'tool_result', 'thinking', 'redacted_thinking']);
const knownStreamEventTypes = new Set([
	'message_start',
	'content_block_start',
	'content_block_delta',
	'content_block_stop',
	'message_delta',
	'message_stop',
	'ping',
	'error',
]);

export const AnthropicTextContentBlockSchema = z.looseObject({
	type: z.literal('text'),
	text: z.string(),
});

export const AnthropicImageContentBlockSchema = z.looseObject({
	type: z.literal('image'),
	source: z.union([
		z.looseObject({ type: z.literal('base64'), media_type: wireString, data: wireString }),
		z.looseObject({ type: z.literal('url'), url: wireString }),
	]),
});

export const AnthropicToolUseContentBlockSchema = z.looseObject({
	type: z.literal('tool_use'),
	id: wireString,
	name: wireString,
	input: z.unknown(),
});

export const AnthropicToolResultContentBlockSchema = z.looseObject({
	type: z.literal('tool_result'),
	tool_use_id: wireString,
	content: z.union([z.string(), z.array(z.unknown())]).optional(),
	is_error: z.boolean().optional(),
});

export const AnthropicThinkingContentBlockSchema = z.looseObject({
	type: z.literal('thinking'),
	thinking: z.string(),
	signature: z.string().optional(),
});

export const AnthropicRedactedThinkingContentBlockSchema = z.looseObject({
	type: z.literal('redacted_thinking'),
	data: z.string(),
});

const AnthropicUnknownContentBlockSchema = z
	.looseObject({ type: wireString })
	.refine((block) => !knownContentTypes.has(block.type), 'known content blocks must satisfy their wire schema');

export const AnthropicInputContentBlockSchema = z.union([
	AnthropicTextContentBlockSchema,
	AnthropicImageContentBlockSchema,
	AnthropicToolUseContentBlockSchema,
	AnthropicToolResultContentBlockSchema,
	AnthropicThinkingContentBlockSchema,
	AnthropicRedactedThinkingContentBlockSchema,
	AnthropicUnknownContentBlockSchema,
]);

export const AnthropicOutputContentBlockSchema = z.union([
	AnthropicTextContentBlockSchema,
	AnthropicToolUseContentBlockSchema,
	AnthropicThinkingContentBlockSchema,
	AnthropicRedactedThinkingContentBlockSchema,
	AnthropicUnknownContentBlockSchema,
]);

export const AnthropicContentBlockSchema = AnthropicInputContentBlockSchema;

export const AnthropicMessageParamSchema = z.looseObject({
	role: z.enum(['user', 'assistant', 'system']),
	content: z.union([z.string(), z.array(AnthropicInputContentBlockSchema)]),
});

export const AnthropicCustomToolSchema = z.looseObject({
	type: z.literal('custom').optional(),
	name: wireString,
	description: z.string().optional(),
	input_schema: z.looseObject({
		type: z.literal('object'),
		properties: z.unknown().nullable().optional(),
		required: z.array(z.string()).nullable().optional(),
	}),
});

export const AnthropicServerToolSchema = z
	.looseObject({ type: wireString, name: wireString })
	.refine((tool) => tool.type !== 'custom', 'custom tools must provide input_schema');
export const AnthropicToolSchema = z.union([AnthropicCustomToolSchema, AnthropicServerToolSchema]);

export const AnthropicToolChoiceSchema = z.union([
	z.looseObject({
		type: z.enum(['auto', 'any', 'none']),
		disable_parallel_tool_use: z.boolean().optional(),
	}),
	z.looseObject({
		type: z.literal('tool'),
		name: wireString,
		disable_parallel_tool_use: z.boolean().optional(),
	}),
]);

export const AnthropicMessagesRequestSchema = z.looseObject({
	model: wireString,
	max_tokens: z.number().int().positive(),
	messages: z.array(AnthropicMessageParamSchema).min(1),
	system: z.union([z.string(), z.array(z.unknown())]).optional(),
	stream: z.boolean().optional(),
	tools: z.array(AnthropicToolSchema).optional(),
	tool_choice: AnthropicToolChoiceSchema.optional(),
	temperature: z.number().finite().optional(),
	top_p: z.number().finite().optional(),
	top_k: z.number().int().nonnegative().optional(),
	stop_sequences: z.array(z.string()).optional(),
	metadata: z.looseObject({ user_id: z.string().optional() }).optional(),
	service_tier: z.string().optional(),
	thinking: z.unknown().optional(),
	output_config: z.unknown().optional(),
});

// Count Tokens 请求是 Messages 请求的子集：不要求 max_tokens，不支持 stream
export const AnthropicMessagesCountTokensRequestSchema = z.looseObject({
	model: wireString,
	messages: z.array(AnthropicMessageParamSchema).min(1),
	system: z.union([z.string(), z.array(z.unknown())]).optional(),
	tools: z.array(AnthropicToolSchema).optional(),
	tool_choice: AnthropicToolChoiceSchema.optional(),
	thinking: z.unknown().optional(),
	output_config: z.unknown().optional(),
});
export type AnthropicMessagesCountTokensRequest = z.infer<typeof AnthropicMessagesCountTokensRequestSchema>;

export const AnthropicMessagesCountTokensResponseSchema = z.looseObject({
	input_tokens: z.number().int().nonnegative(),
});
export type AnthropicMessagesCountTokensResponse = z.infer<typeof AnthropicMessagesCountTokensResponseSchema>;

export const AnthropicMessageUsageSchema = z.looseObject({
	input_tokens: z.number().int().nonnegative(),
	output_tokens: z.number().int().nonnegative(),
	cache_creation_input_tokens: z.number().int().nonnegative().nullish(),
	cache_read_input_tokens: z.number().int().nonnegative().nullish(),
	cache_creation: z
		.looseObject({
			ephemeral_1h_input_tokens: z.number().int().nonnegative().optional(),
			ephemeral_5m_input_tokens: z.number().int().nonnegative().optional(),
		})
		.nullish(),
	inference_geo: z.string().nullish(),
	output_tokens_details: z.looseObject({ thinking_tokens: z.number().int().nonnegative() }).nullish(),
	server_tool_use: z.looseObject({}).nullish(),
	service_tier: z.enum(['standard', 'priority', 'batch']).nullish(),
});

export const AnthropicMessageStreamUsageSchema = AnthropicMessageUsageSchema.partial();

export const AnthropicMessagesResponseSchema = z.looseObject({
	id: wireString,
	container: z.looseObject({}).nullish(),
	type: z.literal('message'),
	role: z.literal('assistant'),
	content: z.array(AnthropicOutputContentBlockSchema),
	model: wireString,
	stop_reason: z.string().nullable(),
	stop_details: z.looseObject({ type: z.string() }).nullish(),
	stop_sequence: z.string().nullable(),
	usage: AnthropicMessageUsageSchema,
});

export const AnthropicMessageStartEventSchema = z.looseObject({
	type: z.literal('message_start'),
	message: AnthropicMessagesResponseSchema,
});

export const AnthropicContentBlockStartEventSchema = z.looseObject({
	type: z.literal('content_block_start'),
	index: z.number().int().nonnegative(),
	content_block: AnthropicContentBlockSchema,
});

export const AnthropicContentBlockDeltaEventSchema = z.looseObject({
	type: z.literal('content_block_delta'),
	index: z.number().int().nonnegative(),
	delta: z.looseObject({ type: wireString }),
});

export const AnthropicContentBlockStopEventSchema = z.looseObject({
	type: z.literal('content_block_stop'),
	index: z.number().int().nonnegative(),
});

export const AnthropicMessageDeltaEventSchema = z.looseObject({
	type: z.literal('message_delta'),
	delta: z.looseObject({
		container: z.looseObject({}).nullish(),
		stop_details: z.looseObject({ type: z.string() }).nullish(),
		stop_reason: z.string().nullable(),
		stop_sequence: z.string().nullable(),
	}),
	usage: AnthropicMessageStreamUsageSchema,
});

export const AnthropicMessageStopEventSchema = z.looseObject({
	type: z.literal('message_stop'),
});

export const AnthropicPingEventSchema = z.looseObject({ type: z.literal('ping') });

export const AnthropicErrorEventSchema = z.looseObject({
	type: z.literal('error'),
	error: z.looseObject({ type: wireString, message: z.string() }),
});

const AnthropicUnknownStreamEventSchema = z
	.looseObject({ type: wireString })
	.refine((event) => !knownStreamEventTypes.has(event.type), 'known stream events must satisfy their wire schema');

export const AnthropicMessagesStreamEventSchema = z.union([
	AnthropicMessageStartEventSchema,
	AnthropicContentBlockStartEventSchema,
	AnthropicContentBlockDeltaEventSchema,
	AnthropicContentBlockStopEventSchema,
	AnthropicMessageDeltaEventSchema,
	AnthropicMessageStopEventSchema,
	AnthropicPingEventSchema,
	AnthropicErrorEventSchema,
	AnthropicUnknownStreamEventSchema,
]);

export type AnthropicMessagesRequest = z.infer<typeof AnthropicMessagesRequestSchema>;
export type AnthropicMessageUsage = z.infer<typeof AnthropicMessageUsageSchema>;
export type AnthropicMessageStreamUsage = z.infer<typeof AnthropicMessageStreamUsageSchema>;
export type AnthropicMessagesResponse = z.infer<typeof AnthropicMessagesResponseSchema>;
export type AnthropicMessagesStreamEvent = z.infer<typeof AnthropicMessagesStreamEventSchema>;
