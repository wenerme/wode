/**
 * Tool Loop Agent Handler
 * Uses AI SDK with MCP tools for agentic chat
 */
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, stepCountIs, streamText, type Tool } from 'ai';
import consola from 'consola';
import type { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { ModelConfig } from '../server/schema';

const log = consola.withTag('agent');

export interface AgentHandlerOptions {
	resolveModelConfig: (modelName: string) => ModelConfig | null;
	getMcpTools?: (servers?: string[]) => Promise<Record<string, Tool>>;
}

export interface AgentRequest {
	model: string;
	messages: Array<{
		role: 'user' | 'assistant' | 'system';
		content: string;
	}>;
	tools?: string[]; // Tool names to enable
	mcpServers?: string[]; // MCP server names to load tools from
	maxSteps?: number; // Max tool loop iterations (default: 5)
	stream?: boolean;
}

/**
 * Normalize base URL - strip trailing /v1 if present
 */
function normalizeBaseUrl(url: string): string {
	return url.replace(/\/v1\/?$/, '');
}

/**
 * Register agent routes on Hono app
 */
export function registerAgentRoutes(app: Hono, options: AgentHandlerOptions) {
	const { resolveModelConfig, getMcpTools } = options;

	/**
	 * POST /v1/agent/chat
	 * Agent chat with tool loop support
	 */
	app.post('/v1/agent/chat', async (c) => {
		try {
			const body = await c.req.json<AgentRequest>();
			const { model: modelName, messages, mcpServers, maxSteps = 5, stream = false } = body;

			// Resolve model config
			const modelConfig = resolveModelConfig(modelName);
			if (!modelConfig) {
				return c.json(
					{
						error: {
							message: `Model not found: ${modelName}`,
							type: 'invalid_request_error',
							code: 'model_not_found',
						},
					},
					404,
				);
			}

			// Get API key
			const apiKey = modelConfig.apiKey;
			const baseUrl = normalizeBaseUrl(modelConfig.baseUrl || '');

			if (!baseUrl) {
				return c.json(
					{
						error: {
							message: 'Model has no baseUrl configured',
							type: 'invalid_request_error',
							code: 'invalid_model_config',
						},
					},
					400,
				);
			}

			// Create AI provider
			const provider = createOpenAICompatible({
				name: 'mcps-agent',
				baseURL: `${baseUrl}/v1`,
				apiKey: apiKey || 'not-needed',
			});

			const aiModel = provider.chatModel(modelName);

			// Get MCP tools if available
			let tools: Record<string, Tool> = {};
			if (getMcpTools && mcpServers && mcpServers.length > 0) {
				try {
					tools = await getMcpTools(mcpServers);
					log.info(`Loaded ${Object.keys(tools).length} tools from MCP servers: ${mcpServers.join(', ')}`);
				} catch (err) {
					log.warn('Failed to load MCP tools:', err);
				}
			}

			// Convert messages
			const aiMessages = messages.map((m) => ({
				role: m.role as 'user' | 'assistant' | 'system',
				content: m.content,
			}));

			log.info(
				`→ POST /v1/agent/chat model=${modelName} messages=${messages.length} tools=${Object.keys(tools).length} maxSteps=${maxSteps}`,
			);

			if (stream) {
				// Streaming response
				return streamSSE(c, async (sseStream) => {
					try {
						const result = streamText({
							model: aiModel,
							messages: aiMessages,
							tools: Object.keys(tools).length > 0 ? tools : undefined,
							stopWhen: stepCountIs(maxSteps),
							onStepFinish: async (step) => {
								// Send step info
								await sseStream.writeSSE({
									data: JSON.stringify({
										type: 'step',
										text: step.text,
										toolCalls: step.toolCalls?.map((tc) => ({
											id: tc.toolCallId,
											name: tc.toolName,
											arguments: 'input' in tc ? tc.input : undefined,
										})),
										toolResults: step.toolResults?.map((tr) => ({
											id: tr.toolCallId,
											name: tr.toolName,
											result: 'output' in tr ? tr.output : undefined,
										})),
									}),
								});
							},
						});

						// Stream text deltas
						for await (const part of result.textStream) {
							await sseStream.writeSSE({
								data: JSON.stringify({
									type: 'text',
									content: part,
								}),
							});
						}

						// Get final result
						const finalResult = await result;
						const usage = await finalResult.usage;
						const steps = await finalResult.steps;

						// Send usage info
						await sseStream.writeSSE({
							data: JSON.stringify({
								type: 'usage',
								usage: {
									promptTokens: usage?.inputTokens,
									completionTokens: usage?.outputTokens,
									totalTokens: (usage?.inputTokens || 0) + (usage?.outputTokens || 0),
								},
							}),
						});

						// Send done
						await sseStream.writeSSE({ data: '[DONE]' });

						log.info(`← 200 /v1/agent/chat model=${modelName} steps=${steps?.length || 1}`);
					} catch (err) {
						log.error('Agent streaming error:', err);
						await sseStream.writeSSE({
							data: JSON.stringify({
								type: 'error',
								error: err instanceof Error ? err.message : 'Streaming error',
							}),
						});
					}
				});
			}

			// Non-streaming response
			const result = await generateText({
				model: aiModel,
				messages: aiMessages,
				tools: Object.keys(tools).length > 0 ? tools : undefined,
				stopWhen: stepCountIs(maxSteps),
			});

			log.info(
				`← 200 /v1/agent/chat model=${modelName} steps=${result.steps?.length || 1} tokens=${result.usage?.totalTokens || 0}`,
			);

			// Format response
			return c.json({
				id: `agent-${Date.now()}`,
				object: 'agent.chat.completion',
				model: modelName,
				content: result.text,
				reasoning: result.reasoning,
				steps: result.steps?.map((step) => ({
					text: step.text,
					toolCalls: step.toolCalls?.map((tc) => ({
						id: tc.toolCallId,
						name: tc.toolName,
						arguments: 'input' in tc ? tc.input : undefined,
					})),
					toolResults: step.toolResults?.map((tr) => ({
						id: tr.toolCallId,
						name: tr.toolName,
						result: 'output' in tr ? tr.output : undefined,
					})),
				})),
				usage: {
					prompt_tokens: result.usage?.inputTokens,
					completion_tokens: result.usage?.outputTokens,
					total_tokens: (result.usage?.inputTokens || 0) + (result.usage?.outputTokens || 0),
				},
			});
		} catch (error) {
			log.error('Agent error:', error);
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
}
