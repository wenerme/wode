import { z } from 'zod';

export const AnthropicTextContentBlockSchema = z.looseObject({
	type: z.literal('text'),
	text: z.string(),
});

export const AnthropicImageContentBlockSchema = z.looseObject({
	type: z.literal('image'),
	source: z.union([
		z.looseObject({ type: z.literal('base64'), media_type: z.string(), data: z.string() }),
		z.looseObject({ type: z.literal('url'), url: z.string() }),
	]),
});

export const AnthropicToolUseContentBlockSchema = z.looseObject({
	type: z.literal('tool_use'),
	id: z.string(),
	name: z.string(),
	input: z.unknown(),
});

export const AnthropicToolResultContentBlockSchema = z.looseObject({
	type: z.literal('tool_result'),
	tool_use_id: z.string(),
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

// Exact branches run first; this fallback preserves unknown and incomplete known content blocks.
const AnthropicUnknownContentBlockSchema = z.looseObject({ type: z.string() });

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
	role: z.string(),
	content: z.union([z.string(), z.array(AnthropicInputContentBlockSchema)]),
});

export const AnthropicCustomToolSchema = z.looseObject({
	type: z.literal('custom').optional(),
	name: z.string(),
	description: z.string().optional(),
	input_schema: z.looseObject({
		type: z.literal('object'),
		properties: z.unknown().nullable().optional(),
		required: z.array(z.string()).nullable().optional(),
	}),
});

export const AnthropicServerToolSchema = z
	.looseObject({ type: z.string(), name: z.string() })
	.refine((tool) => tool.type !== 'custom', 'exact custom tools require input_schema');
// Exact branches run first; this fallback preserves unknown and incomplete tool definitions.
const AnthropicToolFallbackSchema = z.looseObject({ type: z.string() });
export const AnthropicToolSchema = z.union([
	AnthropicCustomToolSchema,
	AnthropicServerToolSchema,
	AnthropicToolFallbackSchema,
]);

export const AnthropicToolChoiceSchema = z.union([
	z.looseObject({
		type: z.string(),
		disable_parallel_tool_use: z.boolean().optional(),
	}),
	z.looseObject({
		type: z.literal('tool'),
		name: z.string(),
		disable_parallel_tool_use: z.boolean().optional(),
	}),
	z.looseObject({ type: z.string() }),
]);

export const AnthropicMessagesRequestSchema = z.looseObject({
	model: z.string().describe('Model identifier'),
	max_tokens: z.number().multipleOf(1).describe('Maximum output tokens'),
	messages: z.array(AnthropicMessageParamSchema).describe('Conversation messages'),
	system: z
		.union([z.string(), z.array(z.unknown())])
		.optional()
		.describe('System instructions'),
	stream: z.boolean().optional().describe('Stream response'),
	tools: z.array(AnthropicToolSchema).optional().describe('Available tools'),
	tool_choice: AnthropicToolChoiceSchema.optional().describe('Tool choice strategy'),
	temperature: z.number().finite().optional().describe('Sampling temperature'),
	top_p: z.number().finite().optional().describe('Nucleus sampling threshold'),
	top_k: z.number().multipleOf(1).optional().describe('Top-k sampling count'),
	stop_sequences: z.array(z.string()).optional().describe('Stop sequences'),
	metadata: z
		.looseObject({ user_id: z.string().nullish().describe('End-user identifier') })
		.optional()
		.describe('Additional request metadata'),
	service_tier: z.string().optional().describe('Service tier'),
	thinking: z.unknown().optional().describe('Reasoning settings'),
	output_config: z.unknown().optional().describe('Output settings'),
});

// Count Tokens 请求是 Messages 请求的子集：不要求 max_tokens，不支持 stream
export const AnthropicMessagesCountTokensRequestSchema = z.looseObject({
	model: z.string().describe('Model identifier'),
	messages: z.array(AnthropicMessageParamSchema).describe('Messages to count'),
	system: z.union([z.string(), z.array(z.unknown())]).optional(),
	tools: z.array(AnthropicToolSchema).optional(),
	tool_choice: AnthropicToolChoiceSchema.optional(),
	thinking: z.unknown().optional(),
	output_config: z.unknown().optional(),
});
export type AnthropicMessagesCountTokensRequest = z.infer<typeof AnthropicMessagesCountTokensRequestSchema>;

export const AnthropicMessagesCountTokensResponseSchema = z.looseObject({
	input_tokens: z.number().multipleOf(1).describe('Input token count'),
});
export type AnthropicMessagesCountTokensResponse = z.infer<typeof AnthropicMessagesCountTokensResponseSchema>;

export const AnthropicMessageUsageSchema = z.looseObject({
	input_tokens: z.number().multipleOf(1).describe('Input token count'),
	output_tokens: z.number().multipleOf(1).describe('Output token count'),
	cache_creation_input_tokens: z.number().multipleOf(1).nullish().describe('Cache creation input token count'),
	cache_read_input_tokens: z.number().multipleOf(1).nullish().describe('Cache read input token count'),
	cache_creation: z
		.looseObject({
			ephemeral_1h_input_tokens: z.number().multipleOf(1).optional(),
			ephemeral_5m_input_tokens: z.number().multipleOf(1).optional(),
		})
		.nullish(),
	inference_geo: z.string().nullish().describe('Inference region'),
	output_tokens_details: z
		.looseObject({ thinking_tokens: z.number().multipleOf(1).describe('Reasoning token count') })
		.nullish()
		.describe('Output token details'),
	server_tool_use: z.looseObject({}).nullish().describe('Server tool usage'),
	service_tier: z.string().nullish().describe('Service tier'),
});

export const AnthropicMessageStreamUsageSchema = AnthropicMessageUsageSchema.partial().extend({
	input_tokens: z.number().multipleOf(1).nullish().describe('Input token count'),
	output_tokens: z.number().multipleOf(1).optional().describe('Output token count'),
});

export const AnthropicMessagesResponseSchema = z.looseObject({
	id: z.string().describe('Message identifier'),
	container: z.looseObject({}).nullish(),
	type: z.string().min(1),
	role: z.string().min(1),
	content: z.array(AnthropicOutputContentBlockSchema).describe('Output content parts'),
	model: z.string().describe('Model identifier'),
	stop_reason: z.string().nullable().describe('Stop reason'),
	stop_details: z.looseObject({ type: z.string() }).nullish(),
	stop_sequence: z.string().nullable().describe('Stop sequence'),
	usage: AnthropicMessageUsageSchema.describe('Token usage'),
});

export const AnthropicMessageStartEventSchema = z.looseObject({
	type: z.literal('message_start'),
	message: AnthropicMessagesResponseSchema,
});

export const AnthropicContentBlockStartEventSchema = z.looseObject({
	type: z.literal('content_block_start'),
	index: z.number().multipleOf(1),
	content_block: AnthropicContentBlockSchema,
});

export const AnthropicContentBlockDeltaEventSchema = z.looseObject({
	type: z.literal('content_block_delta'),
	index: z.number().multipleOf(1),
	delta: z.looseObject({ type: z.string() }),
});

export const AnthropicContentBlockStopEventSchema = z.looseObject({
	type: z.literal('content_block_stop'),
	index: z.number().multipleOf(1),
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
	error: z.looseObject({ type: z.string(), message: z.string() }),
});

// Exact event branches run first; this fallback preserves unknown and incomplete known events.
const AnthropicUnknownStreamEventSchema = z.looseObject({ type: z.string() });

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
