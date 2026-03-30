/**
 * Anthropic Messages API Schema
 * Based on Anthropic API specification
 */
import { z } from 'zod';

// ============================================================================
// Content Block Types
// ============================================================================

/**
 * Text content block
 */
export const TextBlockSchema = z.object({
	type: z.literal('text'),
	text: z.string(),
});
export type TextBlock = z.infer<typeof TextBlockSchema>;

/**
 * Image source - base64
 */
export const Base64ImageSourceSchema = z.object({
	type: z.literal('base64'),
	media_type: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
	data: z.string(),
});

/**
 * Image source - URL
 */
export const UrlImageSourceSchema = z.object({
	type: z.literal('url'),
	url: z.string(),
});

/**
 * Image content block
 */
export const ImageBlockSchema = z.object({
	type: z.literal('image'),
	source: z.union([Base64ImageSourceSchema, UrlImageSourceSchema]),
});
export type ImageBlock = z.infer<typeof ImageBlockSchema>;

/**
 * Tool use content block (assistant output)
 */
export const ToolUseBlockSchema = z.object({
	type: z.literal('tool_use'),
	id: z.string(),
	name: z.string(),
	input: z.record(z.string(), z.any()),
});
export type ToolUseBlock = z.infer<typeof ToolUseBlockSchema>;

/**
 * Tool result content block (user input)
 */
export const ToolResultBlockSchema = z.object({
	type: z.literal('tool_result'),
	tool_use_id: z.string(),
	content: z.union([z.string(), z.array(z.union([TextBlockSchema, ImageBlockSchema]))]).optional(),
	is_error: z.boolean().optional(),
});
export type ToolResultBlock = z.infer<typeof ToolResultBlockSchema>;

/**
 * Content block union for user messages
 */
export const UserContentBlockSchema = z.union([TextBlockSchema, ImageBlockSchema, ToolResultBlockSchema]);
export type UserContentBlock = z.infer<typeof UserContentBlockSchema>;

/**
 * Content block union for assistant messages
 */
export const AssistantContentBlockSchema = z.union([TextBlockSchema, ToolUseBlockSchema]);
export type AssistantContentBlock = z.infer<typeof AssistantContentBlockSchema>;

// ============================================================================
// Message Types
// ============================================================================

/**
 * User message
 */
export const AnthropicUserMessageSchema = z.object({
	role: z.literal('user'),
	content: z.union([z.string(), z.array(UserContentBlockSchema)]),
});
export type AnthropicUserMessage = z.infer<typeof AnthropicUserMessageSchema>;

/**
 * Assistant message
 */
export const AnthropicAssistantMessageSchema = z.object({
	role: z.literal('assistant'),
	content: z.union([z.string(), z.array(AssistantContentBlockSchema)]),
});
export type AnthropicAssistantMessage = z.infer<typeof AnthropicAssistantMessageSchema>;

/**
 * Message union
 */
export const AnthropicMessageSchema = z.union([AnthropicUserMessageSchema, AnthropicAssistantMessageSchema]);
export type AnthropicMessage = z.infer<typeof AnthropicMessageSchema>;

// ============================================================================
// Tool Types
// ============================================================================

/**
 * Tool input schema
 */
export const ToolInputSchemaSchema = z.object({
	type: z.literal('object'),
	properties: z.record(z.string(), z.any()).optional(),
	required: z.array(z.string()).optional(),
});

/**
 * Tool definition
 */
export const AnthropicToolSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	input_schema: ToolInputSchemaSchema,
});
export type AnthropicTool = z.infer<typeof AnthropicToolSchema>;

/**
 * Tool choice
 */
export const AnthropicToolChoiceSchema = z.union([
	z.object({ type: z.literal('auto') }),
	z.object({ type: z.literal('any') }),
	z.object({
		type: z.literal('tool'),
		name: z.string(),
	}),
]);
export type AnthropicToolChoice = z.infer<typeof AnthropicToolChoiceSchema>;

// ============================================================================
// Request Types
// ============================================================================

/**
 * Messages API request
 */
export const MessagesRequestSchema = z.object({
	/** Model identifier */
	model: z.string(),
	/** List of messages */
	messages: z.array(AnthropicMessageSchema),
	/** Maximum tokens to generate */
	max_tokens: z.number().int(),
	/** System prompt */
	system: z.string().optional(),
	/** Sampling temperature (0-1) */
	temperature: z.number().min(0).max(1).optional(),
	/** Top-p sampling */
	top_p: z.number().min(0).max(1).optional(),
	/** Top-k sampling */
	top_k: z.number().int().optional(),
	/** Stop sequences */
	stop_sequences: z.array(z.string()).optional(),
	/** Enable streaming */
	stream: z.boolean().optional(),
	/** Available tools */
	tools: z.array(AnthropicToolSchema).optional(),
	/** Tool choice preference */
	tool_choice: AnthropicToolChoiceSchema.optional(),
	/** Metadata */
	metadata: z
		.object({
			user_id: z.string().optional(),
		})
		.optional(),
});
export type MessagesRequest = z.infer<typeof MessagesRequestSchema>;

// ============================================================================
// Response Types
// ============================================================================

/**
 * Stop reason
 */
export const StopReasonSchema = z.enum(['end_turn', 'max_tokens', 'stop_sequence', 'tool_use']);
export type StopReason = z.infer<typeof StopReasonSchema>;

/**
 * Usage information
 */
export const AnthropicUsageSchema = z.object({
	input_tokens: z.number().int(),
	output_tokens: z.number().int(),
});
export type AnthropicUsage = z.infer<typeof AnthropicUsageSchema>;

/**
 * Messages API response
 */
export const MessagesResponseSchema = z.object({
	id: z.string(),
	type: z.literal('message'),
	role: z.literal('assistant'),
	content: z.array(z.union([TextBlockSchema, ToolUseBlockSchema])),
	model: z.string(),
	stop_reason: StopReasonSchema.nullable(),
	stop_sequence: z.string().nullable().optional(),
	usage: AnthropicUsageSchema,
});
export type MessagesResponse = z.infer<typeof MessagesResponseSchema>;

// ============================================================================
// Streaming Types
// ============================================================================

/**
 * Message start event
 */
export const MessageStartEventSchema = z.object({
	type: z.literal('message_start'),
	message: z.object({
		id: z.string(),
		type: z.literal('message'),
		role: z.literal('assistant'),
		content: z.array(z.any()),
		model: z.string(),
		stop_reason: z.null(),
		stop_sequence: z.null(),
		usage: z.object({
			input_tokens: z.number().int(),
			output_tokens: z.number().int(),
		}),
	}),
});

/**
 * Content block start event
 */
export const ContentBlockStartEventSchema = z.object({
	type: z.literal('content_block_start'),
	index: z.number().int(),
	content_block: z.union([
		z.object({ type: z.literal('text'), text: z.string() }),
		z.object({ type: z.literal('tool_use'), id: z.string(), name: z.string(), input: z.object({}) }),
	]),
});

/**
 * Content block delta event
 */
export const ContentBlockDeltaEventSchema = z.object({
	type: z.literal('content_block_delta'),
	index: z.number().int(),
	delta: z.union([
		z.object({ type: z.literal('text_delta'), text: z.string() }),
		z.object({ type: z.literal('input_json_delta'), partial_json: z.string() }),
	]),
});

/**
 * Content block stop event
 */
export const ContentBlockStopEventSchema = z.object({
	type: z.literal('content_block_stop'),
	index: z.number().int(),
});

/**
 * Message delta event
 */
export const MessageDeltaEventSchema = z.object({
	type: z.literal('message_delta'),
	delta: z.object({
		stop_reason: StopReasonSchema.nullable().optional(),
		stop_sequence: z.string().nullable().optional(),
	}),
	usage: z.object({
		output_tokens: z.number().int(),
	}),
});

/**
 * Message stop event
 */
export const MessageStopEventSchema = z.object({
	type: z.literal('message_stop'),
});

/**
 * Ping event
 */
export const PingEventSchema = z.object({
	type: z.literal('ping'),
});

/**
 * Error event
 */
export const ErrorEventSchema = z.object({
	type: z.literal('error'),
	error: z.object({
		type: z.string(),
		message: z.string(),
	}),
});

/**
 * Stream event union
 */
export const StreamEventSchema = z.discriminatedUnion('type', [
	MessageStartEventSchema,
	ContentBlockStartEventSchema,
	ContentBlockDeltaEventSchema,
	ContentBlockStopEventSchema,
	MessageDeltaEventSchema,
	MessageStopEventSchema,
	PingEventSchema,
	ErrorEventSchema,
]);
export type StreamEvent = z.infer<typeof StreamEventSchema>;
