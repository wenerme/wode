/**
 * OpenAI Chat Completions API Schema
 * Based on OpenAI API specification
 */
import { z } from 'zod';
import { ContentPartSchema, MessageContentSchema, ToolCallSchema, ToolSchema, UsageSchema } from './openai.types';

// ============================================================================
// Message Types
// ============================================================================

/**
 * System message
 */
export const SystemMessageSchema = z.object({
	role: z.literal('system'),
	content: z.string(),
	name: z.string().optional(),
});

/**
 * User message
 */
export const UserMessageSchema = z.object({
	role: z.literal('user'),
	content: MessageContentSchema,
	name: z.string().optional(),
});

/**
 * Assistant message
 */
export const AssistantMessageSchema = z.object({
	role: z.literal('assistant'),
	content: z.string().nullable().optional(),
	name: z.string().optional(),
	tool_calls: z.array(ToolCallSchema).optional(),
	refusal: z.string().nullable().optional(),
});

/**
 * Tool message (result of tool call)
 */
export const ToolMessageSchema = z.object({
	role: z.literal('tool'),
	content: z.string(),
	tool_call_id: z.string(),
});

/**
 * Developer message (OpenAI specific)
 */
export const DeveloperMessageSchema = z.object({
	role: z.literal('developer'),
	content: z.string(),
	name: z.string().optional(),
});

/**
 * Chat message union
 */
export const ChatMessageSchema = z.discriminatedUnion('role', [
	SystemMessageSchema,
	UserMessageSchema,
	AssistantMessageSchema,
	ToolMessageSchema,
	DeveloperMessageSchema,
]);
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ============================================================================
// Request Types
// ============================================================================

/**
 * Response format for structured outputs
 */
export const ResponseFormatSchema = z.union([
	z.object({ type: z.literal('text') }),
	z.object({ type: z.literal('json_object') }),
	z.object({
		type: z.literal('json_schema'),
		json_schema: z.object({
			name: z.string(),
			description: z.string().optional(),
			schema: z.record(z.string(), z.any()).optional(),
			strict: z.boolean().optional(),
		}),
	}),
]);
export type ResponseFormat = z.infer<typeof ResponseFormatSchema>;

/**
 * Tool choice option
 */
export const ToolChoiceSchema = z.union([
	z.literal('none'),
	z.literal('auto'),
	z.literal('required'),
	z.object({
		type: z.literal('function'),
		function: z.object({
			name: z.string(),
		}),
	}),
]);
export type ToolChoice = z.infer<typeof ToolChoiceSchema>;

/**
 * Chat completion request parameters
 */
export const ChatCompletionRequestSchema = z.object({
	/** Model identifier */
	model: z.string(),
	/** List of messages */
	messages: z.array(ChatMessageSchema),
	/** Sampling temperature (0-2) */
	temperature: z.number().min(0).max(2).optional(),
	/** Nucleus sampling */
	top_p: z.number().min(0).max(1).optional(),
	/** Number of completions to generate */
	n: z.number().int().min(1).optional(),
	/** Enable streaming */
	stream: z.boolean().optional(),
	/** Stream options */
	stream_options: z
		.object({
			include_usage: z.boolean().optional(),
		})
		.optional(),
	/** Stop sequences */
	stop: z.union([z.string(), z.array(z.string())]).optional(),
	/** Maximum tokens to generate */
	max_tokens: z.number().int().optional(),
	/** Maximum completion tokens (newer API) */
	max_completion_tokens: z.number().int().optional(),
	/** Presence penalty (-2 to 2) */
	presence_penalty: z.number().min(-2).max(2).optional(),
	/** Frequency penalty (-2 to 2) */
	frequency_penalty: z.number().min(-2).max(2).optional(),
	/** Token bias */
	logit_bias: z.record(z.string(), z.number()).optional(),
	/** Log probabilities */
	logprobs: z.boolean().optional(),
	/** Top log probabilities to return */
	top_logprobs: z.number().int().min(0).max(20).optional(),
	/** User identifier */
	user: z.string().optional(),
	/** Response format */
	response_format: ResponseFormatSchema.optional(),
	/** Random seed for deterministic outputs */
	seed: z.number().int().optional(),
	/** Available tools */
	tools: z.array(ToolSchema).optional(),
	/** Tool choice preference */
	tool_choice: ToolChoiceSchema.optional(),
	/** Enable parallel tool calls */
	parallel_tool_calls: z.boolean().optional(),
	/** Service tier */
	service_tier: z.enum(['auto', 'default', 'flex', 'priority']).optional(),
	/** Store the completion */
	store: z.boolean().optional(),
	/** Metadata */
	metadata: z.record(z.string(), z.string()).optional(),
	/** Reasoning effort level (o1/o3 models) */
	reasoning_effort: z.enum(['low', 'medium', 'high']).optional(),
	/** Enable thinking mode (deepseek/qwen thinking models) */
	enable_thinking: z.boolean().optional(),
	/** Thinking configuration (OpenAI o-series) */
	thinking: z
		.object({
			type: z.enum(['enabled', 'disabled']).optional(),
			budget_tokens: z.number().int().optional(),
		})
		.optional(),
});
export type ChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;

// ============================================================================
// Response Types
// ============================================================================

/**
 * Log probability information
 */
export const LogprobsSchema = z.object({
	content: z
		.array(
			z.object({
				token: z.string(),
				logprob: z.number(),
				bytes: z.array(z.number()).nullable().optional(),
				top_logprobs: z
					.array(
						z.object({
							token: z.string(),
							logprob: z.number(),
							bytes: z.array(z.number()).nullable().optional(),
						}),
					)
					.optional(),
			}),
		)
		.nullable(),
});

/**
 * Finish reason for a completion
 */
export const FinishReasonSchema = z.enum(['stop', 'length', 'tool_calls', 'content_filter', 'function_call']);
export type FinishReason = z.infer<typeof FinishReasonSchema>;

/**
 * Chat completion choice
 */
export const ChatCompletionChoiceSchema = z.object({
	index: z.number().int(),
	message: z.object({
		role: z.literal('assistant'),
		content: z.string().nullable(),
		tool_calls: z.array(ToolCallSchema).optional(),
		refusal: z.string().nullable().optional(),
	}),
	finish_reason: FinishReasonSchema.nullable(),
	logprobs: LogprobsSchema.nullable().optional(),
});
export type ChatCompletionChoice = z.infer<typeof ChatCompletionChoiceSchema>;

/**
 * Chat completion response
 */
export const ChatCompletionResponseSchema = z.object({
	id: z.string(),
	object: z.literal('chat.completion'),
	created: z.number().int(),
	model: z.string(),
	choices: z.array(ChatCompletionChoiceSchema),
	usage: UsageSchema.optional(),
	system_fingerprint: z.string().optional(),
	service_tier: z.string().nullable().optional(),
});
export type ChatCompletionResponse = z.infer<typeof ChatCompletionResponseSchema>;

// ============================================================================
// Streaming Types
// ============================================================================

/**
 * Delta content for streaming
 */
export const ChatCompletionDeltaSchema = z.object({
	role: z.literal('assistant').optional(),
	content: z.string().nullable().optional(),
	tool_calls: z
		.array(
			z.object({
				index: z.number().int(),
				id: z.string().optional(),
				type: z.literal('function').optional(),
				function: z
					.object({
						name: z.string().optional(),
						arguments: z.string().optional(),
					})
					.optional(),
			}),
		)
		.optional(),
	refusal: z.string().nullable().optional(),
});
export type ChatCompletionDelta = z.infer<typeof ChatCompletionDeltaSchema>;

/**
 * Streaming choice
 */
export const ChatCompletionChunkChoiceSchema = z.object({
	index: z.number().int(),
	delta: ChatCompletionDeltaSchema,
	finish_reason: FinishReasonSchema.nullable(),
	logprobs: LogprobsSchema.nullable().optional(),
});

/**
 * Streaming chunk
 */
export const ChatCompletionChunkSchema = z.object({
	id: z.string(),
	object: z.literal('chat.completion.chunk'),
	created: z.number().int(),
	model: z.string(),
	choices: z.array(ChatCompletionChunkChoiceSchema),
	usage: UsageSchema.nullable().optional(),
	system_fingerprint: z.string().optional(),
	service_tier: z.string().nullable().optional(),
});
export type ChatCompletionChunk = z.infer<typeof ChatCompletionChunkSchema>;

// ============================================================================
// OpenAI Responses API Types (Newer API)
// ============================================================================

/**
 * Input item for Responses API
 */
export const ResponseInputItemSchema = z.union([
	// Text input
	z.object({
		type: z.literal('message'),
		role: z.enum(['user', 'assistant', 'system']),
		content: z.union([z.string(), z.array(ContentPartSchema)]),
	}),
	// Reference to previous response
	z.object({
		type: z.literal('item_reference'),
		id: z.string(),
	}),
]);
export type ResponseInputItem = z.infer<typeof ResponseInputItemSchema>;

/**
 * Response modality
 */
export const ResponseModalitySchema = z.enum(['text', 'audio']);
export type ResponseModality = z.infer<typeof ResponseModalitySchema>;

/**
 * Response create request
 */
export const ResponseCreateRequestSchema = z.object({
	/** Model to use */
	model: z.string(),
	/** Input messages or items */
	input: z.union([z.string(), z.array(ResponseInputItemSchema)]),
	/** System instructions */
	instructions: z.string().optional(),
	/** Modalities for output */
	modalities: z.array(ResponseModalitySchema).optional(),
	/** Temperature */
	temperature: z.number().min(0).max(2).optional(),
	/** Top P */
	top_p: z.number().min(0).max(1).optional(),
	/** Max output tokens */
	max_output_tokens: z.number().int().optional(),
	/** Stop sequences */
	stop: z.union([z.string(), z.array(z.string())]).optional(),
	/** Stream the response */
	stream: z.boolean().optional(),
	/** Available tools */
	tools: z.array(ToolSchema).optional(),
	/** Tool choice */
	tool_choice: ToolChoiceSchema.optional(),
	/** Parallel tool calls */
	parallel_tool_calls: z.boolean().optional(),
	/** Response format */
	text: z
		.object({
			format: ResponseFormatSchema.optional(),
		})
		.optional(),
	/** Metadata */
	metadata: z.record(z.string(), z.string()).optional(),
	/** Store the response */
	store: z.boolean().optional(),
	/** Previous response ID to continue from */
	previous_response_id: z.string().optional(),
	/** Truncation strategy */
	truncation: z.enum(['auto', 'disabled']).optional(),
	/** User identifier */
	user: z.string().optional(),
});
export type ResponseCreateRequest = z.infer<typeof ResponseCreateRequestSchema>;

/**
 * Response output item
 */
export const ResponseOutputItemSchema = z.object({
	id: z.string(),
	type: z.enum(['message', 'function_call', 'function_call_output', 'reasoning']),
	role: z.enum(['assistant', 'user', 'system']).optional(),
	content: z
		.array(
			z.object({
				type: z.enum(['text', 'refusal', 'audio']),
				text: z.string().optional(),
				refusal: z.string().optional(),
			}),
		)
		.optional(),
	status: z.enum(['completed', 'incomplete', 'in_progress']).optional(),
});
export type ResponseOutputItem = z.infer<typeof ResponseOutputItemSchema>;

/**
 * Response object
 */
export const ResponseObjectSchema = z.object({
	id: z.string(),
	object: z.literal('response'),
	created_at: z.number().int(),
	model: z.string(),
	status: z.enum(['completed', 'failed', 'in_progress', 'cancelled', 'incomplete']),
	output: z.array(ResponseOutputItemSchema),
	usage: UsageSchema.optional(),
	metadata: z.record(z.string(), z.string()).optional(),
	error: z
		.object({
			type: z.string(),
			message: z.string(),
			code: z.string().optional(),
		})
		.nullable()
		.optional(),
});
export type ResponseObject = z.infer<typeof ResponseObjectSchema>;
