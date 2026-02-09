/**
 * Common types for chat API
 */
import { z } from 'zod';

// ============================================================================
// Provider Configuration (wener-mcps specific)
// ============================================================================

/**
 * Protocol type for model providers
 */
export type ProtocolType = 'openai' | 'anthropic' | 'gemini';

/**
 * Provider endpoint configuration
 */
export const ProviderEndpointSchema = z.object({
	baseUrl: z.string(),
	headers: z.record(z.string(), z.string()).optional(),
	processors: z.array(z.string()).optional(),
});
export type ProviderEndpoint = z.infer<typeof ProviderEndpointSchema>;

/**
 * Model configuration
 */
export const ModelConfigSchema = z.object({
	/** Base URL for the API */
	baseUrl: z.string().optional(),
	/** API key (uses Authorization: Bearer header) */
	apiKey: z.string().optional(),
	/** Additional headers */
	headers: z.record(z.string(), z.string()).optional(),
	/** Default adapter for protocol conversion */
	adapter: z.enum(['openai', 'anthropic', 'gemini']).optional(),
	/** Adapter-specific endpoints */
	adapters: z
		.object({
			openai: ProviderEndpointSchema.optional(),
			anthropic: ProviderEndpointSchema.optional(),
			gemini: ProviderEndpointSchema.optional(),
		})
		.optional(),
	/** Processor chain */
	processors: z.array(z.string()).optional(),
});
export type ModelConfig = z.infer<typeof ModelConfigSchema>;

/**
 * Chat configuration with models
 */
export const ChatConfigSchema = z.object({
	models: z.record(z.string(), ModelConfigSchema).optional(),
});
export type ChatConfig = z.infer<typeof ChatConfigSchema>;

// ============================================================================
// Stream Event Types
// ============================================================================

/**
 * Stream event types for SSE
 */
export type StreamEventType =
	| 'message_start'
	| 'content_block_start'
	| 'content_block_delta'
	| 'content_block_stop'
	| 'message_delta'
	| 'message_stop'
	| 'error';
