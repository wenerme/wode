/**
 * Chat API Handler
 * Provides unified AI model gateway with protocol conversion
 */

import { CreateMessageRequestSchema } from '@wener/ai/anthropic';
import { CreateGenerateContentRequestSchema } from '@wener/ai/google';
import {
	type CreateChatCompletionRequest,
	CreateChatCompletionRequestSchema,
	type CreateResponseRequest,
	CreateResponseRequestSchema,
} from '@wener/ai/openai';
import consola from 'consola';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { ChatProtocol, createAuditContext, extractClientIp } from '../audit/chat';
import type { ChatConfig, ModelConfig } from '../server/schema';
import {
	anthropicToOpenaiResponse,
	geminiToOpenaiResponse,
	openaiToAnthropicRequest,
	openaiToGeminiRequest,
} from './converters';

const log = consola.withTag('chat');

export interface ChatHandlerOptions {
	config?: ChatConfig;
}

/**
 * Create chat handler Hono app
 */
export function createChatHandler(options: ChatHandlerOptions = {}) {
	const app = new Hono();
	const { config = {} } = options;

	/**
	 * Resolve model configuration
	 */
	function resolveModelConfig(modelName: string): ModelConfig | null {
		const models = config.models;
		if (!models || models.length === 0) return null;

		// First pass: exact match
		for (const modelConfig of models) {
			if (modelConfig.name === modelName) {
				return modelConfig;
			}
		}

		// Second pass: wildcard matches (e.g., "gpt-*" or "claude-*")
		for (const modelConfig of models) {
			const pattern = modelConfig.name;
			if (pattern.includes('*')) {
				const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
				if (regex.test(modelName)) {
					return modelConfig;
				}
			}
		}

		return null;
	}

	/**
	 * Make request to upstream provider
	 */
	async function makeUpstreamRequest(
		url: string,
		body: unknown,
		headers: Record<string, string>,
		_stream: boolean = false,
	): Promise<Response> {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...headers,
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorText = await response.text();
			log.error('Upstream error:', response.status, errorText);
			throw new Error(`Upstream error: ${response.status} ${errorText}`);
		}

		return response;
	}

	/**
	 * Normalize base URL - strip trailing /v1 if present
	 * This allows baseUrl to be specified as either "http://example.com" or "http://example.com/v1"
	 */
	function normalizeBaseUrl(url: string): string {
		return url.replace(/\/v1\/?$/, '');
	}

	/**
	 * Build headers for upstream request
	 */
	function buildUpstreamHeaders(
		modelConfig: ModelConfig,
		adapter: 'openai' | 'anthropic' | 'gemini',
	): Record<string, string> {
		const headers: Record<string, string> = {};

		// Add API key if configured
		if (modelConfig.apiKey) {
			if (adapter === 'anthropic') {
				headers['x-api-key'] = modelConfig.apiKey;
				headers['anthropic-version'] = '2023-06-01';
			} else {
				headers.Authorization = `Bearer ${modelConfig.apiKey}`;
			}
		}

		// Add custom headers
		if (modelConfig.headers) {
			Object.assign(headers, modelConfig.headers);
		}

		// Add adapter-specific headers
		if (modelConfig.adapters?.[adapter]?.headers) {
			Object.assign(headers, modelConfig.adapters[adapter]?.headers);
		}

		return headers;
	}

	/**
	 * Normalize OpenAI request for different providers
	 * Handles max_tokens/max_completion_tokens compatibility and thinking parameters
	 */
	function normalizeOpenAIRequest(request: CreateChatCompletionRequest): Record<string, unknown> {
		const normalized: Record<string, unknown> = { ...request };

		// Handle max_tokens vs max_completion_tokens compatibility
		// Some providers only support max_tokens, others prefer max_completion_tokens
		if (request.max_completion_tokens && !request.max_tokens) {
			normalized.max_tokens = request.max_completion_tokens;
		}

		// Handle enable_thinking parameter (used by Qwen, DeepSeek thinking models)
		// Convert to thinking object format if needed
		if (request.enable_thinking !== undefined && !request.thinking) {
			normalized.thinking = {
				type: request.enable_thinking ? 'enabled' : 'disabled',
			};
		}

		return normalized;
	}

	// =========================================================================
	// OpenAI Chat Completions API
	// =========================================================================

	app.post('/v1/chat/completions', async (c) => {
		// Create audit context early
		let auditCtx: ReturnType<typeof createAuditContext> | null = null;

		try {
			const body = await c.req.json();
			const parseResult = CreateChatCompletionRequestSchema.safeParse(body);

			if (!parseResult.success) {
				return c.json(
					{
						error: {
							message: 'Invalid request',
							type: 'invalid_request_error',
							param: null,
							code: 'invalid_request',
							details: parseResult.error.issues,
						},
					},
					400,
				);
			}

			const request = parseResult.data;
			const modelConfig = resolveModelConfig(request.model);

			if (!modelConfig) {
				return c.json(
					{
						error: {
							message: `Model ${request.model} not configured`,
							type: 'invalid_request_error',
							param: 'model',
							code: 'model_not_found',
						},
					},
					404,
				);
			}

			// Determine upstream adapter
			const adapter = modelConfig.adapter || 'openai';
			const baseUrl = normalizeBaseUrl(
				modelConfig.adapters?.[adapter]?.baseUrl || modelConfig.baseUrl || 'https://api.openai.com',
			);

			// Create audit context
			const outputProtocol =
				adapter === 'anthropic'
					? ChatProtocol.ANTHROPIC
					: adapter === 'gemini'
						? ChatProtocol.GEMINI
						: ChatProtocol.OPENAI;

			auditCtx = createAuditContext({
				method: 'POST',
				endpoint: '/v1/chat/completions',
				model: request.model,
				inputProtocol: ChatProtocol.OPENAI,
				outputProtocol,
				streaming: request.stream || false,
				clientIp: extractClientIp(c),
				userAgent: c.req.header('user-agent'),
				requestMeta: {
					temperature: request.temperature,
					max_tokens: request.max_tokens || request.max_completion_tokens,
					top_p: request.top_p,
				},
			});

			// Log incoming request
			log.info(
				`→ POST /v1/chat/completions model=${request.model} stream=${request.stream || false} messages=${request.messages.length}`,
			);

			// Build upstream request based on protocol
			let upstreamUrl: string;
			let upstreamBody: unknown;
			let upstreamHeaders: Record<string, string>;

			switch (adapter) {
				case 'anthropic': {
					upstreamUrl = `${baseUrl}/v1/messages`;
					upstreamBody = openaiToAnthropicRequest(request);
					upstreamHeaders = buildUpstreamHeaders(modelConfig, 'anthropic');
					break;
				}
				case 'gemini': {
					const method = request.stream ? 'streamGenerateContent' : 'generateContent';
					upstreamUrl = `${baseUrl}/v1/models/${request.model}:${method}`;
					upstreamBody = openaiToGeminiRequest(request);
					upstreamHeaders = buildUpstreamHeaders(modelConfig, 'gemini');
					break;
				}
				default: {
					// OpenAI adapter - passthrough with parameter normalization
					upstreamUrl = `${baseUrl}/v1/chat/completions`;
					upstreamBody = normalizeOpenAIRequest(request);
					upstreamHeaders = buildUpstreamHeaders(modelConfig, 'openai');
				}
			}

			// Set provider info in audit context
			auditCtx.setProvider({
				provider: adapter,
				upstreamUrl,
			});

			// Handle streaming
			if (request.stream) {
				return handleStreamingRequest(c, upstreamUrl, upstreamBody, upstreamHeaders, adapter, request.model, auditCtx);
			}

			// Non-streaming request
			const response = await makeUpstreamRequest(upstreamUrl, upstreamBody, upstreamHeaders);
			const responseData = await response.json();

			// Convert response if needed
			let result: any;
			switch (adapter) {
				case 'anthropic':
					result = anthropicToOpenaiResponse(responseData, request.model);
					break;
				case 'gemini':
					result = geminiToOpenaiResponse(responseData, request.model);
					break;
				default:
					result = responseData;
			}

			// Record token usage and complete audit
			if (result.usage) {
				auditCtx.setTokenUsage(result.usage.prompt_tokens || 0, result.usage.completion_tokens || 0);
			}
			auditCtx.setResponseMeta({
				finish_reason: result.choices?.[0]?.finish_reason,
				model: result.model,
			});
			await auditCtx.complete(200);

			// Log response
			const usage = result.usage;
			log.info(
				`← 200 /v1/chat/completions model=${result.model || request.model} tokens=${usage?.total_tokens || 0} (in=${usage?.prompt_tokens || 0} out=${usage?.completion_tokens || 0})`,
			);

			return c.json(result);
		} catch (error) {
			// Record error in audit
			if (auditCtx) {
				await auditCtx.error(error instanceof Error ? error.message : 'Unknown error', 'internal_error', 500);
			}
			log.error('Chat completion error:', error);
			return c.json(
				{
					error: {
						message: error instanceof Error ? error.message : 'Internal server error',
						type: 'api_error',
						code: 'internal_error',
					},
				},
				500,
			);
		}
	});

	/**
	 * Handle streaming request
	 */
	async function handleStreamingRequest(
		c: any,
		upstreamUrl: string,
		upstreamBody: unknown,
		upstreamHeaders: Record<string, string>,
		adapter: string,
		model: string,
		auditCtx?: ReturnType<typeof createAuditContext>,
	) {
		const response = await makeUpstreamRequest(upstreamUrl, upstreamBody, upstreamHeaders, true);

		let firstTokenRecorded = false;
		let totalOutputTokens = 0;

		// For streaming, we need to convert events on the fly
		return streamSSE(c, async (stream) => {
			const reader = response.body?.getReader();
			if (!reader) {
				await stream.writeSSE({ data: '[DONE]' });
				if (auditCtx) await auditCtx.complete(200);
				return;
			}

			const decoder = new TextDecoder();
			let buffer = '';

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split('\n');
					buffer = lines.pop() || '';

					for (const line of lines) {
						if (!line.trim()) continue;

						if (line.startsWith('data: ')) {
							const data = line.slice(6);
							if (data === '[DONE]') {
								await stream.writeSSE({ data: '[DONE]' });
								continue;
							}

							try {
								const parsed = JSON.parse(data);
								const converted = convertStreamEvent(parsed, adapter, model);
								if (converted) {
									// Record first token for TTFT
									if (!firstTokenRecorded && auditCtx) {
										auditCtx.recordFirstToken();
										firstTokenRecorded = true;
									}
									// Track usage from stream events
									if (converted.usage) {
										totalOutputTokens = converted.usage.completion_tokens || totalOutputTokens;
									}
									await stream.writeSSE({ data: JSON.stringify(converted) });
								}
							} catch {
								// Skip invalid JSON
							}
						} else if (line.startsWith('event: ')) {
						}
					}
				}

				// Send done signal
				await stream.writeSSE({ data: '[DONE]' });

				// Complete audit
				if (auditCtx) {
					auditCtx.setTokenUsage(0, totalOutputTokens); // Input tokens not available in streaming
					await auditCtx.complete(200);
				}
			} catch (err) {
				// Record streaming error
				if (auditCtx) {
					await auditCtx.error(err instanceof Error ? err.message : 'Streaming error', 'streaming_error', 500);
				}
				throw err;
			} finally {
				reader.releaseLock();
			}
		});
	}

	/**
	 * Convert stream event to OpenAI format
	 */
	function convertStreamEvent(event: any, adapter: string, model: string): any {
		switch (adapter) {
			case 'anthropic':
				return convertAnthropicStreamEvent(event, model);
			case 'gemini':
				return convertGeminiStreamEvent(event, model);
			default:
				return event;
		}
	}

	/**
	 * Convert Anthropic stream event to OpenAI format
	 */
	function convertAnthropicStreamEvent(event: any, model: string): any {
		if (event.type === 'content_block_delta') {
			if (event.delta?.type === 'text_delta') {
				return {
					id: `chatcmpl-${Date.now()}`,
					object: 'chat.completion.chunk',
					created: Math.floor(Date.now() / 1000),
					model,
					choices: [
						{
							index: 0,
							delta: { content: event.delta.text },
							finish_reason: null,
						},
					],
				};
			}
		} else if (event.type === 'message_delta') {
			const finishReason =
				event.delta?.stop_reason === 'end_turn'
					? 'stop'
					: event.delta?.stop_reason === 'tool_use'
						? 'tool_calls'
						: null;
			return {
				id: `chatcmpl-${Date.now()}`,
				object: 'chat.completion.chunk',
				created: Math.floor(Date.now() / 1000),
				model,
				choices: [
					{
						index: 0,
						delta: {},
						finish_reason: finishReason,
					},
				],
				usage: event.usage
					? {
							prompt_tokens: 0,
							completion_tokens: event.usage.output_tokens,
							total_tokens: event.usage.output_tokens,
						}
					: undefined,
			};
		}
		return null;
	}

	/**
	 * Convert Gemini stream event to OpenAI format
	 */
	function convertGeminiStreamEvent(event: any, model: string): any {
		if (event.candidates?.[0]?.content?.parts) {
			const parts = event.candidates[0].content.parts;
			const textParts = parts.filter((p: any) => p.text);

			if (textParts.length > 0) {
				return {
					id: `chatcmpl-${Date.now()}`,
					object: 'chat.completion.chunk',
					created: Math.floor(Date.now() / 1000),
					model,
					choices: [
						{
							index: 0,
							delta: { content: textParts.map((p: any) => p.text).join('') },
							finish_reason: event.candidates[0].finishReason === 'STOP' ? 'stop' : null,
						},
					],
				};
			}
		}
		return null;
	}

	// =========================================================================
	// Anthropic Messages API
	// =========================================================================

	app.post('/v1/messages', async (c) => {
		try {
			const body = await c.req.json();
			const parseResult = CreateMessageRequestSchema.safeParse(body);

			if (!parseResult.success) {
				return c.json(
					{
						type: 'error',
						error: {
							type: 'invalid_request_error',
							message: 'Invalid request',
						},
					},
					400,
				);
			}

			const request = parseResult.data;
			const modelConfig = resolveModelConfig(request.model);

			if (!modelConfig) {
				return c.json(
					{
						type: 'error',
						error: {
							type: 'invalid_request_error',
							message: `Model ${request.model} not configured`,
						},
					},
					404,
				);
			}

			// For Anthropic endpoint, we pass through to Anthropic or convert from OpenAI
			const adapter = modelConfig.adapter || 'anthropic';
			const baseUrl = normalizeBaseUrl(
				modelConfig.adapters?.[adapter]?.baseUrl || modelConfig.baseUrl || 'https://api.anthropic.com',
			);

			const upstreamUrl = `${baseUrl}/v1/messages`;
			const upstreamHeaders = buildUpstreamHeaders(modelConfig, 'anthropic');

			// Log incoming request
			log.info(`→ POST /v1/messages model=${request.model} messages=${request.messages.length}`);

			const response = await makeUpstreamRequest(upstreamUrl, request, upstreamHeaders);
			const responseData = await response.json();

			// Log response
			const usage = responseData.usage;
			log.info(
				`← 200 /v1/messages model=${responseData.model || request.model} tokens=${(usage?.input_tokens || 0) + (usage?.output_tokens || 0)} (in=${usage?.input_tokens || 0} out=${usage?.output_tokens || 0})`,
			);

			return c.json(responseData);
		} catch (error) {
			log.error('Messages error:', error);
			return c.json(
				{
					type: 'error',
					error: {
						type: 'api_error',
						message: error instanceof Error ? error.message : 'Internal server error',
					},
				},
				500,
			);
		}
	});

	// =========================================================================
	// Gemini Generate Content API
	// =========================================================================

	app.post('/v1/models/:model\\:generateContent', async (c) => {
		try {
			const model = c.req.param('model');
			if (!model) {
				return c.json({ error: { message: 'Model parameter is required' } }, 400);
			}

			const body = await c.req.json();
			const parseResult = CreateGenerateContentRequestSchema.safeParse(body);

			if (!parseResult.success) {
				return c.json({ error: { message: 'Invalid request' } }, 400);
			}

			const request = parseResult.data;
			const modelConfig = resolveModelConfig(model);

			if (!modelConfig) {
				return c.json({ error: { message: `Model ${model} not configured` } }, 404);
			}

			const baseUrl = normalizeBaseUrl(
				modelConfig.adapters?.gemini?.baseUrl || modelConfig.baseUrl || 'https://generativelanguage.googleapis.com',
			);

			const upstreamUrl = `${baseUrl}/v1/models/${model}:generateContent`;
			const upstreamHeaders = buildUpstreamHeaders(modelConfig, 'gemini');

			// Log incoming request
			log.info(`→ POST /v1/models/${model}:generateContent contents=${request.contents?.length || 0}`);

			const response = await makeUpstreamRequest(upstreamUrl, request, upstreamHeaders);
			const responseData = await response.json();

			// Log response
			const usage = responseData.usageMetadata;
			log.info(
				`← 200 /v1/models/${model}:generateContent tokens=${usage?.totalTokenCount || 0} (in=${usage?.promptTokenCount || 0} out=${usage?.candidatesTokenCount || 0})`,
			);

			return c.json(responseData);
		} catch (error) {
			log.error('Generate content error:', error);
			return c.json({ error: { message: error instanceof Error ? error.message : 'Internal server error' } }, 500);
		}
	});

	// =========================================================================
	// Gemini Streaming Generate Content API
	// =========================================================================

	app.post('/v1/models/:model\\:streamGenerateContent', async (c) => {
		try {
			const model = c.req.param('model');
			if (!model) {
				return c.json({ error: { message: 'Model parameter is required' } }, 400);
			}

			const body = await c.req.json();
			const parseResult = CreateGenerateContentRequestSchema.safeParse(body);

			if (!parseResult.success) {
				return c.json({ error: { message: 'Invalid request' } }, 400);
			}

			const request = parseResult.data;

			// Log incoming request
			log.info(`→ POST /v1/models/${model}:streamGenerateContent contents=${request.contents?.length || 0}`);

			const modelConfig = resolveModelConfig(model);

			if (!modelConfig) {
				return c.json({ error: { message: `Model ${model} not configured` } }, 404);
			}

			const baseUrl = normalizeBaseUrl(
				modelConfig.adapters?.gemini?.baseUrl || modelConfig.baseUrl || 'https://generativelanguage.googleapis.com',
			);

			const upstreamUrl = `${baseUrl}/v1/models/${model}:streamGenerateContent`;
			const upstreamHeaders = buildUpstreamHeaders(modelConfig, 'gemini');

			const response = await makeUpstreamRequest(upstreamUrl, request, upstreamHeaders, true);

			// Stream the response directly
			return streamSSE(c, async (stream) => {
				const reader = response.body?.getReader();
				if (!reader) {
					await stream.writeSSE({ data: '[DONE]' });
					return;
				}

				const decoder = new TextDecoder();
				let buffer = '';

				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						buffer += decoder.decode(value, { stream: true });
						const lines = buffer.split('\n');
						buffer = lines.pop() || '';

						for (const line of lines) {
							if (!line.trim()) continue;

							if (line.startsWith('data: ')) {
								const data = line.slice(6);
								if (data === '[DONE]') {
									await stream.writeSSE({ data: '[DONE]' });
									continue;
								}
								await stream.writeSSE({ data });
							}
						}
					}
					await stream.writeSSE({ data: '[DONE]' });
				} finally {
					reader.releaseLock();
				}
			});
		} catch (error) {
			log.error('Stream generate content error:', error);
			return c.json({ error: { message: error instanceof Error ? error.message : 'Internal server error' } }, 500);
		}
	});

	// =========================================================================
	// OpenAI Responses API
	// =========================================================================

	app.post('/v1/responses', async (c) => {
		let auditCtx: ReturnType<typeof createAuditContext> | null = null;

		try {
			const body = await c.req.json();
			const parseResult = CreateResponseRequestSchema.safeParse(body);

			if (!parseResult.success) {
				return c.json(
					{
						error: {
							message: 'Invalid request',
							type: 'invalid_request_error',
							param: null,
							code: 'invalid_request',
							details: parseResult.error.issues,
						},
					},
					400,
				);
			}

			const request = parseResult.data;

			// Handle previous_response_id - load previous context
			let previousContext: { input: unknown; output: unknown[] } | null = null;
			if (request.previous_response_id) {
				try {
					const { isDbInitialized, getEntityManager } = await import('../audit/server/db');
					const { ResponseEntity } = await import('../audit/entities');
					if (isDbInitialized()) {
						const em = getEntityManager().fork();
						const prevResponse = await em.findOne(ResponseEntity, { responseId: request.previous_response_id });
						if (prevResponse) {
							previousContext = {
								input: prevResponse.input,
								output: prevResponse.output,
							};
							log.info(`Loaded previous response: ${request.previous_response_id}`);
						} else {
							log.warn(`Previous response not found: ${request.previous_response_id}`);
						}
					}
				} catch (e) {
					log.warn('Failed to load previous response:', e);
				}
			}

			const modelConfig = resolveModelConfig(request.model);

			if (!modelConfig) {
				return c.json(
					{
						error: {
							message: `Model ${request.model} not configured`,
							type: 'invalid_request_error',
							param: 'model',
							code: 'model_not_found',
						},
					},
					404,
				);
			}

			// Determine adapter - for Responses API, we convert to Chat Completions
			const adapter = modelConfig.adapter || 'openai';
			const baseUrl = normalizeBaseUrl(
				modelConfig.adapters?.[adapter]?.baseUrl || modelConfig.baseUrl || 'https://api.openai.com',
			);

			// Create audit context
			auditCtx = createAuditContext({
				method: 'POST',
				endpoint: '/v1/responses',
				model: request.model,
				inputProtocol: ChatProtocol.OPENAI,
				outputProtocol: ChatProtocol.OPENAI,
				streaming: request.stream || false,
				clientIp: extractClientIp(c),
				userAgent: c.req.header('user-agent'),
				requestMeta: {
					temperature: request.temperature,
					max_output_tokens: request.max_output_tokens,
				},
			});

			// Log incoming request
			const inputType =
				typeof request.input === 'string'
					? 'string'
					: Array.isArray(request.input)
						? `array[${request.input.length}]`
						: 'object';
			log.info(`→ POST /v1/responses model=${request.model} stream=${request.stream || false} input=${inputType}`);

			// Convert Responses API request to Chat Completions format
			const chatRequest = responsesToChatCompletions(request, previousContext);

			// Build upstream request
			const upstreamUrl = `${baseUrl}/v1/chat/completions`;
			const upstreamHeaders = buildUpstreamHeaders(modelConfig, 'openai');

			auditCtx.setProvider({
				provider: adapter,
				upstreamUrl,
			});

			// Handle streaming
			if (request.stream) {
				return handleResponsesStreamingRequest(c, upstreamUrl, chatRequest, upstreamHeaders, request.model, auditCtx);
			}

			// Non-streaming request
			const response = await makeUpstreamRequest(upstreamUrl, chatRequest, upstreamHeaders);
			const chatResponse = await response.json();

			// Convert Chat Completions response to Responses format
			const result = chatCompletionsToResponses(chatResponse, request.model);

			// Store response for future previous_response_id lookups
			try {
				const { isDbInitialized, getEntityManager } = await import('../audit/server/db');
				const { ResponseEntity } = await import('../audit/entities');
				if (isDbInitialized()) {
					const em = getEntityManager().fork();
					const responseEntity = new ResponseEntity();
					responseEntity.responseId = result.id;
					responseEntity.model = result.model;
					responseEntity.status = result.status;
					responseEntity.input = request.input;
					responseEntity.output = result.output;
					responseEntity.usage = result.usage;
					responseEntity.instructions = request.instructions ?? undefined;
					responseEntity.previousResponseId = request.previous_response_id ?? undefined;
					responseEntity.tools = request.tools ?? undefined;
					responseEntity.toolChoice = request.tool_choice ?? undefined;
					responseEntity.metadata = request.metadata as Record<string, unknown>;
					responseEntity.durationMs = auditCtx?.getDuration();
					em.persist(responseEntity);
					await em.flush();
					log.debug(`Stored response: ${result.id}`);
				}
			} catch (e) {
				log.warn('Failed to store response:', e);
			}

			// Record usage
			if (chatResponse.usage) {
				auditCtx.setTokenUsage(chatResponse.usage.prompt_tokens || 0, chatResponse.usage.completion_tokens || 0);
			}
			auditCtx.setResponseMeta({
				status: result.status,
				output_items: result.output.length,
			});
			await auditCtx.complete(200);

			// Log response
			const usage = chatResponse.usage;
			log.info(
				`← 200 /v1/responses model=${result.model || request.model} status=${result.status} tokens=${usage?.total_tokens || 0}`,
			);

			return c.json(result);
		} catch (error) {
			if (auditCtx) {
				await auditCtx.error(error instanceof Error ? error.message : 'Unknown error', 'internal_error', 500);
			}
			log.error('Responses API error:', error);
			return c.json(
				{
					error: {
						message: error instanceof Error ? error.message : 'Internal server error',
						type: 'api_error',
						code: 'internal_error',
					},
				},
				500,
			);
		}
	});

	/**
	 * Convert Responses API request to Chat Completions format
	 */
	function responsesToChatCompletions(
		request: CreateResponseRequest,
		previousContext?: { input: unknown; output: unknown[] } | null,
	): CreateChatCompletionRequest {
		const messages: CreateChatCompletionRequest['messages'] = [];

		// Add system instruction if present
		if (request.instructions) {
			messages.push({
				role: 'system',
				content: request.instructions,
			});
		}

		// Add previous context if available (previous_response_id)
		if (previousContext) {
			// Add previous input
			const prevInput = previousContext.input;
			if (typeof prevInput === 'string') {
				messages.push({ role: 'user', content: prevInput });
			} else if (Array.isArray(prevInput)) {
				for (const item of prevInput as any[]) {
					if (item.type === 'message') {
						messages.push({
							role: item.role as 'user' | 'assistant' | 'system',
							content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
						} as any);
					}
				}
			}

			// Add previous output as assistant messages
			for (const item of previousContext.output as any[]) {
				if (item.type === 'message' && item.role === 'assistant') {
					const textContent = item.content?.find((c: any) => c.type === 'text' || c.type === 'output_text');
					if (textContent) {
						messages.push({
							role: 'assistant',
							content: textContent.text,
						});
					}
				}
			}
		}

		// Convert current input to messages
		if (typeof request.input === 'string') {
			messages.push({
				role: 'user',
				content: request.input,
			});
		} else if (Array.isArray(request.input)) {
			for (const item of request.input) {
				if (item.type === 'message') {
					messages.push({
						role: item.role as 'user' | 'assistant' | 'system',
						content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
					} as any);
				}
				// item_reference is handled differently - would need to fetch the referenced item
			}
		}

		return {
			model: request.model,
			messages,
			temperature: request.temperature,
			top_p: request.top_p,
			max_tokens: request.max_output_tokens,
			stream: request.stream,
			tools: request.tools,
			tool_choice: request.tool_choice,
			parallel_tool_calls: request.parallel_tool_calls,
			metadata: request.metadata,
			store: request.store,
			user: request.user,
		} as CreateChatCompletionRequest;
	}

	/**
	 * Convert Chat Completions response to Responses format
	 */
	function chatCompletionsToResponses(chatResponse: any, model: string): any {
		const responseId = `resp_${chatResponse.id || Date.now()}`;
		const output: any[] = [];

		for (const choice of chatResponse.choices || []) {
			const message = choice.message;
			if (message) {
				output.push({
					id: `item_${responseId}_${choice.index}`,
					type: 'message',
					role: 'assistant',
					content: message.content ? [{ type: 'text', text: message.content }] : [],
					status: 'completed',
				});

				// Handle tool calls
				if (message.tool_calls) {
					for (const toolCall of message.tool_calls) {
						output.push({
							id: toolCall.id,
							type: 'function_call',
							name: toolCall.function?.name,
							arguments: toolCall.function?.arguments,
							status: 'completed',
						});
					}
				}
			}
		}

		return {
			id: responseId,
			object: 'response',
			created_at: chatResponse.created || Math.floor(Date.now() / 1000),
			model: chatResponse.model || model,
			status: 'completed',
			output,
			usage: chatResponse.usage,
			metadata: {},
			error: null,
		};
	}

	/**
	 * Handle Responses API streaming
	 */
	async function handleResponsesStreamingRequest(
		c: any,
		upstreamUrl: string,
		upstreamBody: unknown,
		upstreamHeaders: Record<string, string>,
		model: string,
		auditCtx?: ReturnType<typeof createAuditContext>,
	) {
		const response = await makeUpstreamRequest(
			upstreamUrl,
			{ ...(upstreamBody as any), stream: true },
			upstreamHeaders,
			true,
		);

		let firstTokenRecorded = false;
		const responseId = `resp_${Date.now()}`;

		return streamSSE(c, async (stream) => {
			const reader = response.body?.getReader();
			if (!reader) {
				await stream.writeSSE({ event: 'response.done', data: JSON.stringify({ type: 'response.done' }) });
				if (auditCtx) await auditCtx.complete(200);
				return;
			}

			// Send initial event
			await stream.writeSSE({
				event: 'response.created',
				data: JSON.stringify({
					type: 'response.created',
					response: {
						id: responseId,
						object: 'response',
						created_at: Math.floor(Date.now() / 1000),
						model,
						status: 'in_progress',
						output: [],
					},
				}),
			});

			const decoder = new TextDecoder();
			let buffer = '';
			let outputItemId = `item_${responseId}_0`;

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split('\n');
					buffer = lines.pop() || '';

					for (const line of lines) {
						if (!line.trim() || !line.startsWith('data: ')) continue;

						const data = line.slice(6);
						if (data === '[DONE]') continue;

						try {
							const parsed = JSON.parse(data);
							const delta = parsed.choices?.[0]?.delta;

							if (delta?.content) {
								if (!firstTokenRecorded && auditCtx) {
									auditCtx.recordFirstToken();
									firstTokenRecorded = true;
								}

								await stream.writeSSE({
									event: 'response.output_text.delta',
									data: JSON.stringify({
										type: 'response.output_text.delta',
										output_index: 0,
										content_index: 0,
										delta: delta.content,
									}),
								});
							}
						} catch {
							// Skip invalid JSON
						}
					}
				}

				// Send completion events
				await stream.writeSSE({
					event: 'response.output_item.done',
					data: JSON.stringify({
						type: 'response.output_item.done',
						output_index: 0,
						item: {
							id: outputItemId,
							type: 'message',
							role: 'assistant',
							status: 'completed',
						},
					}),
				});

				await stream.writeSSE({
					event: 'response.done',
					data: JSON.stringify({
						type: 'response.done',
						response: {
							id: responseId,
							status: 'completed',
						},
					}),
				});

				if (auditCtx) await auditCtx.complete(200);
			} catch (err) {
				if (auditCtx) {
					await auditCtx.error(err instanceof Error ? err.message : 'Streaming error', 'streaming_error', 500);
				}
				throw err;
			} finally {
				reader.releaseLock();
			}
		});
	}

	// =========================================================================
	// Models endpoint
	// =========================================================================

	app.get('/v1/models', async (c) => {
		const fetchUpstream = c.req.query('fetch') === 'true';
		const allModels: Array<{
			id: string;
			object: string;
			created: number;
			owned_by: string;
			context_window?: number;
			max_input_tokens?: number;
			max_output_tokens?: number;
		}> = [];

		// Add configured models
		for (const m of config.models || []) {
			allModels.push({
				id: m.name,
				object: 'model',
				created: Math.floor(Date.now() / 1000),
				owned_by: 'mcps',
				context_window: m.contextWindow,
				max_input_tokens: m.maxInputTokens,
				max_output_tokens: m.maxOutputTokens,
			});

			// Fetch upstream models if enabled
			if (fetchUpstream && m.fetchUpstreamModels && m.baseUrl) {
				try {
					const headers: Record<string, string> = {
						'Content-Type': 'application/json',
					};
					if (m.apiKey) {
						headers.Authorization = `Bearer ${m.apiKey}`;
					}
					Object.assign(headers, m.headers || {});

					const normalizedUrl = normalizeBaseUrl(m.baseUrl);
					const upstreamUrl = `${normalizedUrl}/v1/models`;

					const res = await fetch(upstreamUrl, { headers });
					if (res.ok) {
						const data = await res.json();
						if (data.data && Array.isArray(data.data)) {
							for (const model of data.data) {
								// Avoid duplicates
								if (!allModels.some((existing) => existing.id === model.id)) {
									allModels.push({
										id: model.id,
										object: model.object || 'model',
										created: model.created || Math.floor(Date.now() / 1000),
										owned_by: model.owned_by || m.name.split('/')[0] || 'upstream',
									});
								}
							}
						}
					}
				} catch (e) {
					log.warn(`Failed to fetch upstream models from ${m.baseUrl}: ${e}`);
				}
			}
		}

		log.debug(`→ GET /v1/models count=${allModels.length} fetch=${fetchUpstream}`);

		return c.json({
			object: 'list',
			data: allModels,
		});
	});

	return app;
}
