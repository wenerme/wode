/**
 * Generic/Loose OpenAI-compatible Schemas
 *
 * These schemas use z.looseObject() to allow additional properties to pass through,
 * making them suitable for protocol conversion and proxy scenarios.
 *
 * Design principles (ref: pydantic-ai, litellm):
 * - Complete field definitions covering latest API features
 * - Loose input via z.looseObject() (equivalent to pydantic extra="allow")
 * - Enough information for protocol conversion and auditing
 *
 * Includes:
 * - Common types (Message, ToolCall, etc.)
 * - Chat Completions API (request, response, streaming)
 * - Responses API (request, response)
 */
import { z } from 'zod';

// ============================================================================
// Common Generic Types
// ============================================================================

/**
 * Prompt tokens details - breakdown of prompt token usage
 */
export const PromptTokensDetailsSchema = z.looseObject({
	/** Tokens from prompt cache */
	cached_tokens: z.number().int().nullable().optional(),
	/** Audio-related input tokens */
	audio_tokens: z.number().int().nullable().optional(),
});

/**
 * Completion tokens details - breakdown of completion token usage
 */
export const CompletionTokensDetailsSchema = z.looseObject({
	/** Tokens used for reasoning (o-series models) */
	reasoning_tokens: z.number().int().nullable().optional(),
	/** Audio-related output tokens */
	audio_tokens: z.number().int().nullable().optional(),
	/** Accepted predicted tokens */
	accepted_prediction_tokens: z.number().int().nullable().optional(),
	/** Rejected predicted tokens */
	rejected_prediction_tokens: z.number().int().nullable().optional(),
});

/**
 * Usage information - unified across providers
 *
 * Covers both OpenAI format (prompt_tokens/completion_tokens) and
 * Anthropic format (input_tokens/output_tokens).
 */
export const UsageSchema = z.looseObject({
	/** Input/prompt tokens (Anthropic format) */
	input_tokens: z.number().nullable().optional(),
	/** Output/completion tokens (Anthropic format) */
	output_tokens: z.number().nullable().optional(),
	/** Total tokens */
	total_tokens: z.number().nullable().optional(),
	/** Prompt tokens (OpenAI format) */
	prompt_tokens: z.number().nullable().optional(),
	/** Completion tokens (OpenAI format) */
	completion_tokens: z.number().nullable().optional(),
	/** Detailed breakdown of prompt tokens */
	prompt_tokens_details: PromptTokensDetailsSchema.nullable().optional(),
	/** Detailed breakdown of completion tokens */
	completion_tokens_details: CompletionTokensDetailsSchema.nullable().optional(),
	/** Anthropic: tokens used to create cache entry */
	cache_creation_input_tokens: z.number().int().nullable().optional(),
	/** Anthropic: tokens read from cache */
	cache_read_input_tokens: z.number().int().nullable().optional(),
});
export type Usage = z.infer<typeof UsageSchema>;

/**
 * Text content part - common structure
 */
export const TextPartSchema = z.looseObject({
	type: z.literal('text'),
	text: z.string(),
});

/**
 * Image content part - supports both URL and base64
 */
export const ImagePartSchema = z.looseObject({
	type: z.literal('image_url'),
	image_url: z.looseObject({
		url: z.string(),
		detail: z.enum(['auto', 'low', 'high']).nullable().optional(),
	}),
});

/**
 * Audio content part - for audio input
 */
export const InputAudioPartSchema = z.looseObject({
	type: z.literal('input_audio'),
	input_audio: z.looseObject({
		/** Base64-encoded audio data */
		data: z.string(),
		/** Audio format (e.g., "wav", "mp3") */
		format: z.string(),
	}),
});

/**
 * Content part union
 */
export const ContentPartSchema = z.union([
	TextPartSchema,
	ImagePartSchema,
	InputAudioPartSchema,
	z.looseObject({ type: z.string() }), // Allow other types to pass through
]);

/**
 * Message content - string or array of parts
 */
export const MessageContentSchema = z.union([z.string(), z.array(ContentPartSchema)]);

/**
 * Tool call in assistant message
 */
export const ToolCallSchema = z.looseObject({
	id: z.string(),
	type: z.literal('function'),
	function: z.looseObject({
		name: z.string(),
		arguments: z.string(),
	}),
});

/**
 * Tool definition
 */
export const ToolSchema = z.looseObject({
	type: z.literal('function'),
	function: z.looseObject({
		name: z.string(),
		description: z.string().nullable().optional(),
		parameters: z.record(z.string(), z.any()).nullable().optional(),
		strict: z.boolean().nullable().optional(),
	}),
});

/**
 * Generic message schema - loose to allow provider-specific fields
 */
export const MessageSchema = z.looseObject({
	role: z.enum(['system', 'user', 'assistant', 'tool', 'developer']),
	content: MessageContentSchema.nullable().optional(),
	name: z.string().nullable().optional(),
	tool_calls: z.array(ToolCallSchema).nullable().optional(),
	tool_call_id: z.string().nullable().optional(),
	/** Thinking/reasoning content (DeepSeek, Qwen, o-series) */
	reasoning_content: z.string().nullable().optional(),
	/** Audio response from assistant */
	audio: z
		.looseObject({
			id: z.string().nullable().optional(),
			data: z.string().nullable().optional(),
			expires_at: z.number().int().nullable().optional(),
			transcript: z.string().nullable().optional(),
		})
		.nullable()
		.optional(),
});
export type Message = z.infer<typeof MessageSchema>;

/**
 * Tool choice options
 */
export const ToolChoiceSchema = z.union([
	z.literal('none'),
	z.literal('auto'),
	z.literal('required'),
	z.looseObject({
		type: z.literal('function'),
		function: z.looseObject({ name: z.string() }),
	}),
]);

/**
 * Response format options
 */
export const ResponseFormatSchema = z.union([
	z.looseObject({ type: z.literal('text') }),
	z.looseObject({ type: z.literal('json_object') }),
	z.looseObject({
		type: z.literal('json_schema'),
		json_schema: z.looseObject({
			name: z.string(),
			description: z.string().nullable().optional(),
			schema: z.record(z.string(), z.any()).nullable().optional(),
			strict: z.boolean().nullable().optional(),
		}),
	}),
]);

/**
 * Thinking configuration (for o-series and thinking models)
 */
export const ThinkingSchema = z.looseObject({
	type: z.enum(['enabled', 'disabled']).nullable().optional(),
	budget_tokens: z.number().int().nullable().optional(),
});

/**
 * Audio output configuration
 */
export const AudioConfigSchema = z.looseObject({
	/** Voice to use (e.g., "alloy", "echo", "fable", "onyx", "nova", "shimmer") */
	voice: z.string(),
	/** Audio format (e.g., "wav", "mp3", "flac", "opus", "pcm16") */
	format: z.string(),
});

/**
 * Prediction configuration for predicted output
 */
export const PredictionSchema = z.looseObject({
	type: z.literal('content'),
	content: z.union([z.string(), z.array(z.looseObject({ type: z.literal('text'), text: z.string() }))]),
});

export const WebSearchOptionsSchema = z.looseObject({
	search_context_size: z.enum(['low', 'medium', 'high']).nullable().optional(),
	user_location: z
		.looseObject({
			type: z.literal('approximate'),
			approximate: z.looseObject({
				city: z.string().nullable().optional(),
				country: z.string().nullable().optional(),
				region: z.string().nullable().optional(),
				timezone: z.string().nullable().optional(),
			}),
		})
		.nullable()
		.optional(),
});

// ============================================================================
// Chat Completion Request
// ============================================================================

/**
 * Logprob information
 */
export const LogprobSchema = z.looseObject({
	token: z.string(),
	logprob: z.number(),
	bytes: z.array(z.number()).nullable().optional(),
	top_logprobs: z
		.array(
			z.looseObject({
				token: z.string(),
				logprob: z.number(),
				bytes: z.array(z.number()).nullable().optional(),
			}),
		)
		.nullable()
		.optional(),
});

/**
 * Generic Chat Completion Request
 * Compatible with OpenAI, with extensions for other providers
 */
export const CreateChatCompletionRequestSchema = z.looseObject({
	// Required fields
	model: z.string(),
	messages: z.array(MessageSchema),

	// Sampling parameters
	temperature: z.number().min(0).max(2).nullable().optional(),
	top_p: z.number().min(0).max(1).nullable().optional(),
	n: z.number().int().min(1).nullable().optional(),

	// Token limits
	max_tokens: z.number().int().nullable().optional(),
	max_completion_tokens: z.number().int().nullable().optional(),

	// Stop sequences
	stop: z
		.union([z.string(), z.array(z.string())])
		.nullable()
		.optional(),

	// Streaming
	stream: z.boolean().nullable().optional(),
	stream_options: z
		.looseObject({
			include_usage: z.boolean().nullable().optional(),
		})
		.nullable()
		.optional(),

	// Penalties
	presence_penalty: z.number().min(-2).max(2).nullable().optional(),
	frequency_penalty: z.number().min(-2).max(2).nullable().optional(),

	// Logit control
	logit_bias: z.record(z.string(), z.number()).nullable().optional(),
	logprobs: z.boolean().nullable().optional(),
	top_logprobs: z.number().int().min(0).max(20).nullable().optional(),

	// Response format
	response_format: ResponseFormatSchema.nullable().optional(),

	// Output modalities (text, audio)
	modalities: z.array(z.string()).nullable().optional(),
	/** Audio output configuration - required when modalities includes "audio" */
	audio: AudioConfigSchema.nullable().optional(),

	// Tools
	tools: z.array(ToolSchema).nullable().optional(),
	tool_choice: ToolChoiceSchema.nullable().optional(),
	parallel_tool_calls: z.boolean().nullable().optional(),

	// Metadata
	user: z.string().nullable().optional(),
	seed: z.number().int().nullable().optional(),

	// Service options
	service_tier: z.enum(['auto', 'default', 'flex', 'scale', 'priority']).nullable().optional(),
	store: z.boolean().nullable().optional(),
	metadata: z.record(z.string(), z.string()).nullable().optional(),
	verbosity: z.enum(['low', 'medium', 'high']).nullable().optional(),
	web_search_options: WebSearchOptionsSchema.nullable().optional(),

	// Reasoning/thinking (o-series, DeepSeek, Qwen)
	reasoning_effort: z.enum(['low', 'medium', 'high']).nullable().optional(),
	enable_thinking: z.boolean().nullable().optional(),
	thinking: ThinkingSchema.nullable().optional(),

	// Predicted output
	prediction: PredictionSchema.nullable().optional(),

	// Prompt caching
	prompt_cache_key: z.string().nullable().optional(),
	prompt_cache_retention: z.string().nullable().optional(),
});
export type CreateChatCompletionRequest = z.infer<typeof CreateChatCompletionRequestSchema>;

// ============================================================================
// Chat Completion Response
// ============================================================================

/**
 * Choice message in response
 */
export const ChoiceMessageSchema = z.looseObject({
	role: z.literal('assistant'),
	content: z.string().nullable().optional(),
	tool_calls: z.array(ToolCallSchema).nullable().optional(),
	refusal: z.string().nullable().optional(),
	/** Thinking/reasoning content */
	reasoning_content: z.string().nullable().optional(),
	/** Audio response */
	audio: z
		.looseObject({
			id: z.string().nullable().optional(),
			data: z.string().nullable().optional(),
			expires_at: z.number().int().nullable().optional(),
			transcript: z.string().nullable().optional(),
		})
		.nullable()
		.optional(),
	/** Message annotations (url citations, etc.) */
	annotations: z.array(z.any()).nullable().optional(),
});

/**
 * Response choice
 */
export const ChoiceSchema = z.looseObject({
	index: z.number().int(),
	message: ChoiceMessageSchema,
	logprobs: z
		.looseObject({
			content: z.array(LogprobSchema).nullable().optional(),
		})
		.nullable()
		.optional(),
	finish_reason: z.enum(['stop', 'length', 'tool_calls', 'content_filter', 'function_call']).nullable(),
});

/**
 * Generic Chat Completion Response
 */
export const CreateChatCompletionResponseSchema = z.looseObject({
	id: z.string(),
	object: z.literal('chat.completion'),
	created: z.number().int(),
	model: z.string(),
	choices: z.array(ChoiceSchema),
	usage: UsageSchema.nullable().optional(),
	system_fingerprint: z.string().nullable().optional(),
	service_tier: z.string().nullable().optional(),
});
export type CreateChatCompletionResponse = z.infer<typeof CreateChatCompletionResponseSchema>;

// ============================================================================
// Streaming Chunk
// ============================================================================

/**
 * Delta in streaming response
 */
export const DeltaSchema = z.looseObject({
	role: z.literal('assistant').nullable().optional(),
	content: z.string().nullable().optional(),
	tool_calls: z
		.array(
			z.looseObject({
				index: z.number().int(),
				id: z.string().nullable().optional(),
				type: z.literal('function').nullable().optional(),
				function: z
					.looseObject({
						name: z.string().nullable().optional(),
						arguments: z.string().nullable().optional(),
					})
					.nullable()
					.optional(),
			}),
		)
		.nullable()
		.optional(),
	refusal: z.string().nullable().optional(),
	/** Thinking/reasoning content */
	reasoning_content: z.string().nullable().optional(),
	/** Audio delta */
	audio: z
		.looseObject({
			id: z.string().nullable().optional(),
			data: z.string().nullable().optional(),
			expires_at: z.number().int().nullable().optional(),
			transcript: z.string().nullable().optional(),
		})
		.nullable()
		.optional(),
});

/**
 * Streaming choice
 */
export const StreamChoiceSchema = z.looseObject({
	index: z.number().int(),
	delta: DeltaSchema,
	logprobs: z
		.looseObject({
			content: z.array(LogprobSchema).nullable().optional(),
		})
		.nullable()
		.optional(),
	finish_reason: z.enum(['stop', 'length', 'tool_calls', 'content_filter', 'function_call']).nullable().optional(),
});

/**
 * Generic Streaming Chunk
 */
export const CreateChatCompletionStreamChunkSchema = z.looseObject({
	id: z.string(),
	object: z.literal('chat.completion.chunk'),
	created: z.number().int(),
	model: z.string(),
	choices: z.array(StreamChoiceSchema),
	usage: UsageSchema.nullable().optional(),
	system_fingerprint: z.string().nullable().optional(),
	service_tier: z.string().nullable().optional(),
});
export type CreateChatCompletionStreamChunk = z.infer<typeof CreateChatCompletionStreamChunkSchema>;

// ============================================================================
// Responses API
// ============================================================================

/**
 * Response input item
 */
export const ResponseInputItemSchema = z.union([
	z.looseObject({
		type: z.literal('message'),
		role: z.enum(['user', 'assistant', 'system']),
		content: z.union([z.string(), z.array(ContentPartSchema)]),
	}),
	z.looseObject({
		type: z.literal('item_reference'),
		id: z.string(),
	}),
]);

/**
 * Generic Create Response Request (OpenAI Responses API)
 */
export const CreateResponseRequestSchema = z.looseObject({
	model: z.string(),
	input: z.union([z.string(), z.array(ResponseInputItemSchema), z.array(MessageSchema)]),
	instructions: z.string().nullable().optional(),

	// Sampling
	temperature: z.number().min(0).max(2).nullable().optional(),
	top_p: z.number().min(0).max(1).nullable().optional(),
	max_output_tokens: z.number().int().nullable().optional(),

	// Streaming
	stream: z.boolean().nullable().optional(),
	stream_options: z
		.looseObject({
			include_usage: z.boolean().nullable().optional(),
		})
		.nullable()
		.optional(),

	// Tools
	tools: z.array(ToolSchema).nullable().optional(),
	tool_choice: ToolChoiceSchema.nullable().optional(),
	parallel_tool_calls: z.boolean().nullable().optional(),

	// Response format
	text: z
		.looseObject({
			format: z.looseObject({ type: z.string() }).nullable().optional(),
		})
		.nullable()
		.optional(),

	// Metadata
	user: z.string().nullable().optional(),
	metadata: z.record(z.string(), z.string()).nullable().optional(),
	store: z.boolean().nullable().optional(),
	service_tier: z.enum(['auto', 'default', 'flex', 'scale', 'priority']).nullable().optional(),

	// Conversation
	previous_response_id: z.string().nullable().optional(),

	// Reasoning
	reasoning: z
		.looseObject({
			effort: z.enum(['low', 'medium', 'high']).nullable().optional(),
			content: z.enum(['enabled', 'disabled', 'auto']).nullable().optional(),
		})
		.nullable()
		.optional(),

	// Truncation
	truncation: z.enum(['auto', 'disabled']).nullable().optional(),
});
export type CreateResponseRequest = z.infer<typeof CreateResponseRequestSchema>;

/**
 * Response output item
 */
export const ResponseOutputItemSchema = z.looseObject({
	type: z.literal('message'),
	id: z.string().nullable().optional(),
	role: z.literal('assistant'),
	content: z.array(
		z.looseObject({
			type: z.literal('output_text'),
			text: z.string(),
			annotations: z.array(z.any()).nullable().optional(),
		}),
	),
	status: z.string().nullable().optional(),
});

/**
 * Generic Create Response Response
 */
export const CreateResponseResponseSchema = z.looseObject({
	id: z.string(),
	object: z.literal('response'),
	created_at: z.number().int().nullable().optional(),
	model: z.string().nullable().optional(),
	status: z.enum(['in_progress', 'completed', 'incomplete', 'failed']),
	output: z.array(ResponseOutputItemSchema),
	usage: z
		.looseObject({
			input_tokens: z.number().int().nullable().optional(),
			output_tokens: z.number().int().nullable().optional(),
			total_tokens: z.number().int().nullable().optional(),
		})
		.nullable()
		.optional(),
	error: z
		.looseObject({
			code: z.string(),
			message: z.string(),
		})
		.nullable()
		.optional(),
	incomplete_details: z
		.looseObject({
			reason: z.string(),
		})
		.nullable()
		.optional(),
});
export type CreateResponseResponse = z.infer<typeof CreateResponseResponseSchema>;
