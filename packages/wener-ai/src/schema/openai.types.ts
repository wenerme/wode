/**
 * Common base types for OpenAI-compatible APIs
 *
 * These types follow OpenAI conventions and are used as the base
 * for strict schema definitions.
 */
import { z } from 'zod';

// ============================================================================
// Common Message Types
// ============================================================================

/**
 * Role of the message sender
 */
export const MessageRoleSchema = z.enum(['system', 'user', 'assistant', 'tool']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

/**
 * Text content part
 */
export const TextContentPartSchema = z.object({
	type: z.literal('text'),
	text: z.string(),
});
export type TextContentPart = z.infer<typeof TextContentPartSchema>;

/**
 * Image URL content part
 */
export const ImageUrlContentPartSchema = z.object({
	type: z.literal('image_url'),
	image_url: z.object({
		url: z.string(),
		detail: z.enum(['auto', 'low', 'high']).optional(),
	}),
});
export type ImageUrlContentPart = z.infer<typeof ImageUrlContentPartSchema>;

/**
 * Content part union
 */
export const ContentPartSchema = z.union([TextContentPartSchema, ImageUrlContentPartSchema]);
export type ContentPart = z.infer<typeof ContentPartSchema>;

/**
 * Message content - can be string or array of content parts
 */
export const MessageContentSchema = z.union([z.string(), z.array(ContentPartSchema)]);
export type MessageContent = z.infer<typeof MessageContentSchema>;

// ============================================================================
// Tool Types
// ============================================================================

/**
 * Function definition for tools
 */
export const FunctionDefinitionSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	parameters: z.record(z.string(), z.any()).optional(),
	strict: z.boolean().optional(),
});
export type FunctionDefinition = z.infer<typeof FunctionDefinitionSchema>;

/**
 * Tool definition
 */
export const ToolSchema = z.object({
	type: z.literal('function'),
	function: FunctionDefinitionSchema,
});
export type Tool = z.infer<typeof ToolSchema>;

/**
 * Tool call from assistant
 */
export const ToolCallSchema = z.object({
	id: z.string(),
	type: z.literal('function'),
	function: z.object({
		name: z.string(),
		arguments: z.string(),
	}),
});
export type ToolCall = z.infer<typeof ToolCallSchema>;

// ============================================================================
// Usage Types
// ============================================================================

/**
 * Token usage information
 */
export const UsageSchema = z.object({
	prompt_tokens: z.number(),
	completion_tokens: z.number(),
	total_tokens: z.number(),
});
export type Usage = z.infer<typeof UsageSchema>;
