/**
 * Anthropic Messages API Schemas
 *
 * Generic schemas for Anthropic-compatible APIs.
 *
 * Design principles:
 * - Complete field definitions covering latest API features (cache_control, citations, thinking)
 * - Loose input via z.looseObject()
 */
import { z } from 'zod';

/**
 * Cache control configuration for content blocks
 */
export const CacheControlSchema = z.looseObject({
	type: z.literal('ephemeral'),
	/** Cache TTL: "5m" or "1h" */
	ttl: z.string().nullable().optional(),
});

// ============================================================================
// Content Blocks
// ============================================================================

/**
 * Anthropic-style content block
 */
export const ContentBlockSchema = z.union([
	z.looseObject({
		type: z.literal('text'),
		text: z.string(),
		cache_control: CacheControlSchema.nullable().optional(),
		citations: z.array(z.any()).nullable().optional(),
	}),
	z.looseObject({
		type: z.literal('image'),
		source: z.looseObject({
			type: z.enum(['base64', 'url']),
			media_type: z.string().nullable().optional(),
			data: z.string().nullable().optional(),
			url: z.string().nullable().optional(),
		}),
		cache_control: CacheControlSchema.nullable().optional(),
	}),
	z.looseObject({
		type: z.literal('document'),
		source: z.looseObject({
			type: z.string(),
			media_type: z.string().nullable().optional(),
			data: z.string().nullable().optional(),
		}),
		cache_control: CacheControlSchema.nullable().optional(),
	}),
	z.looseObject({
		type: z.literal('tool_use'),
		id: z.string(),
		name: z.string(),
		input: z.record(z.string(), z.any()),
		cache_control: CacheControlSchema.nullable().optional(),
	}),
	z.looseObject({
		type: z.literal('tool_result'),
		tool_use_id: z.string(),
		content: z.any().nullable().optional(),
		is_error: z.boolean().nullable().optional(),
		cache_control: CacheControlSchema.nullable().optional(),
	}),
	z.looseObject({
		type: z.literal('thinking'),
		thinking: z.string(),
	}),
]);

/**
 * Anthropic-style message
 */
export const MessageSchema = z.looseObject({
	role: z.enum(['user', 'assistant']),
	content: z.union([z.string(), z.array(ContentBlockSchema)]),
});

/**
 * Anthropic tool choice
 */
export const ToolChoiceSchema = z.union([
	z.looseObject({ type: z.literal('auto'), disable_parallel_tool_use: z.boolean().nullable().optional() }),
	z.looseObject({ type: z.literal('any'), disable_parallel_tool_use: z.boolean().nullable().optional() }),
	z.looseObject({
		type: z.literal('tool'),
		name: z.string(),
		disable_parallel_tool_use: z.boolean().nullable().optional(),
	}),
	z.looseObject({ type: z.literal('none') }),
]);

// ============================================================================
// Create Message Request
// ============================================================================

/**
 * Generic Create Message Request (Anthropic-style)
 */
export const CreateMessageRequestSchema = z.looseObject({
	model: z.string(),
	messages: z.array(MessageSchema),
	max_tokens: z.number().int(),
	system: z
		.union([
			z.string(),
			z.array(
				z.looseObject({
					type: z.literal('text'),
					text: z.string(),
					cache_control: CacheControlSchema.nullable().optional(),
				}),
			),
		])
		.nullable()
		.optional(),
	temperature: z.number().min(0).max(1).nullable().optional(),
	top_p: z.number().min(0).max(1).nullable().optional(),
	top_k: z.number().int().nullable().optional(),
	stop_sequences: z.array(z.string()).nullable().optional(),
	stream: z.boolean().nullable().optional(),
	tools: z
		.array(
			z.looseObject({
				name: z.string(),
				description: z.string().nullable().optional(),
				input_schema: z.looseObject({
					type: z.literal('object'),
					properties: z.record(z.string(), z.any()).nullable().optional(),
					required: z.array(z.string()).nullable().optional(),
				}),
				cache_control: CacheControlSchema.nullable().optional(),
			}),
		)
		.nullable()
		.optional(),
	tool_choice: ToolChoiceSchema.nullable().optional(),
	metadata: z
		.looseObject({
			user_id: z.string().nullable().optional(),
		})
		.nullable()
		.optional(),
	// Extended thinking
	thinking: z
		.looseObject({
			type: z.literal('enabled'),
			budget_tokens: z.number().int().nullable().optional(),
		})
		.nullable()
		.optional(),
});
export type CreateMessageRequest = z.infer<typeof CreateMessageRequestSchema>;

// ============================================================================
// Create Message Response
// ============================================================================

/**
 * Generic Create Message Response (Anthropic-style)
 */
export const CreateMessageResponseSchema = z.looseObject({
	id: z.string(),
	type: z.literal('message'),
	role: z.literal('assistant'),
	content: z.array(
		z.union([
			z.looseObject({ type: z.literal('text'), text: z.string() }),
			z.looseObject({
				type: z.literal('tool_use'),
				id: z.string(),
				name: z.string(),
				input: z.record(z.string(), z.any()),
			}),
			z.looseObject({
				type: z.literal('thinking'),
				thinking: z.string(),
			}),
		]),
	),
	model: z.string(),
	stop_reason: z.enum(['end_turn', 'max_tokens', 'stop_sequence', 'tool_use', 'pause_turn', 'refusal']).nullable(),
	stop_sequence: z.string().nullable().optional(),
	usage: z.looseObject({
		input_tokens: z.number().int(),
		output_tokens: z.number().int(),
		/** Tokens used to create cache entry */
		cache_creation_input_tokens: z.number().int().nullable().optional(),
		/** Tokens read from cache */
		cache_read_input_tokens: z.number().int().nullable().optional(),
	}),
});
export type CreateMessageResponse = z.infer<typeof CreateMessageResponseSchema>;
