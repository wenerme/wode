/**
 * Protocol converters between different AI model APIs
 *
 * These converters work with loosely-typed objects to support passthrough of
 * provider-specific fields that aren't in the standard schema.
 */

import type { CreateMessageRequest, CreateMessageResponse } from '@wener/ai/anthropic';
import type { CreateGenerateContentRequest, CreateGenerateContentResponse } from '@wener/ai/google';
import type { CreateChatCompletionRequest, CreateChatCompletionResponse, Message } from '@wener/ai/openai';

// Type aliases for converter functions
type ChatMessage = Message;
type AnthropicMessage = CreateMessageRequest['messages'][number];

// ============================================================================
// OpenAI to Anthropic Conversion
// ============================================================================

/**
 * Convert OpenAI messages to Anthropic messages
 */
export function openaiToAnthropicMessages(messages: ChatMessage[]): {
	system?: string;
	messages: AnthropicMessage[];
} {
	let system: string | undefined;
	const anthropicMessages: AnthropicMessage[] = [];

	for (const msg of messages) {
		if (msg.role === 'system') {
			// Combine system messages
			const contentStr = typeof msg.content === 'string' ? msg.content : '';
			system = system ? `${system}\n\n${contentStr}` : contentStr;
		} else if (msg.role === 'user') {
			const content = typeof msg.content === 'string' ? msg.content : convertContentParts((msg.content as any[]) ?? []);
			anthropicMessages.push({ role: 'user', content } as AnthropicMessage);
		} else if (msg.role === 'assistant') {
			if (msg.tool_calls && msg.tool_calls.length > 0) {
				// Convert tool calls to tool_use blocks
				const content = msg.tool_calls.map((tc: any) => ({
					type: 'tool_use' as const,
					id: tc.id,
					name: tc.function.name,
					input: JSON.parse(tc.function.arguments || '{}'),
				}));
				if (msg.content) {
					const textContent = typeof msg.content === 'string' ? msg.content : '';
					content.unshift({ type: 'text' as any, text: textContent } as any);
				}
				anthropicMessages.push({ role: 'assistant', content } as AnthropicMessage);
			} else {
				const contentStr = typeof msg.content === 'string' ? msg.content : '';
				anthropicMessages.push({ role: 'assistant', content: contentStr || '' } as AnthropicMessage);
			}
		} else if (msg.role === 'tool') {
			// Convert tool message to tool_result
			const contentStr = typeof msg.content === 'string' ? msg.content : '';
			anthropicMessages.push({
				role: 'user',
				content: [
					{
						type: 'tool_result',
						tool_use_id: msg.tool_call_id ?? '',
						content: contentStr,
					},
				],
			} as AnthropicMessage);
		}
	}

	return { system, messages: anthropicMessages };
}

function convertContentParts(parts: any[]): any[] {
	return parts.map((part) => {
		if (part.type === 'text') {
			return { type: 'text', text: part.text };
		} else if (part.type === 'image_url') {
			const url = part.image_url.url;
			if (url.startsWith('data:')) {
				// Base64 data URL
				const match = url.match(/^data:([^;]+);base64,(.+)$/);
				if (match) {
					return {
						type: 'image',
						source: {
							type: 'base64',
							media_type: match[1],
							data: match[2],
						},
					};
				}
			}
			// URL reference
			return {
				type: 'image',
				source: {
					type: 'url',
					url,
				},
			};
		}
		return part;
	});
}

/**
 * Convert OpenAI request to Anthropic request
 */
export function openaiToAnthropicRequest(req: CreateChatCompletionRequest): CreateMessageRequest {
	const { system, messages } = openaiToAnthropicMessages(req.messages);

	const anthropicReq: CreateMessageRequest = {
		model: req.model,
		messages,
		max_tokens: req.max_tokens || req.max_completion_tokens || 4096,
		stream: req.stream,
	};

	if (system) {
		anthropicReq.system = system;
	}

	if (req.temperature !== undefined && req.temperature !== null) {
		anthropicReq.temperature = Math.min(req.temperature, 1); // Anthropic max is 1
	}

	if (req.top_p !== undefined) {
		anthropicReq.top_p = req.top_p;
	}

	if (req.stop) {
		anthropicReq.stop_sequences = Array.isArray(req.stop) ? req.stop : [req.stop];
	}

	if (req.tools && req.tools.length > 0) {
		anthropicReq.tools = req.tools.map((tool: any) => ({
			name: tool.function.name,
			description: tool.function.description,
			input_schema: {
				type: 'object' as const,
				properties: (tool.function.parameters?.properties || {}) as Record<string, unknown>,
				required: (tool.function.parameters?.required || []) as string[],
			},
		}));

		if (req.tool_choice) {
			if (req.tool_choice === 'auto') {
				anthropicReq.tool_choice = { type: 'auto' };
			} else if (req.tool_choice === 'required') {
				anthropicReq.tool_choice = { type: 'any' };
			} else if (req.tool_choice === 'none') {
				// Anthropic doesn't have 'none', just don't include tools
				delete anthropicReq.tools;
			} else if (typeof req.tool_choice === 'object') {
				anthropicReq.tool_choice = {
					type: 'tool',
					name: req.tool_choice.function.name,
				};
			}
		}
	}

	return anthropicReq;
}

/**
 * Convert Anthropic response to OpenAI response
 */
export function anthropicToOpenaiResponse(res: CreateMessageResponse, model: string): CreateChatCompletionResponse {
	const toolCalls: any[] = [];
	let textContent = '';

	for (const block of res.content) {
		if (block.type === 'text') {
			textContent += block.text;
		} else if (block.type === 'tool_use') {
			toolCalls.push({
				id: block.id,
				type: 'function',
				function: {
					name: block.name,
					arguments: JSON.stringify(block.input),
				},
			});
		}
	}

	const finishReason = (() => {
		switch (res.stop_reason) {
			case 'end_turn':
				return 'stop';
			case 'max_tokens':
				return 'length';
			case 'tool_use':
				return 'tool_calls';
			case 'stop_sequence':
				return 'stop';
			default:
				return 'stop';
		}
	})();

	return {
		id: res.id,
		object: 'chat.completion',
		created: Math.floor(Date.now() / 1000),
		model: model,
		choices: [
			{
				index: 0,
				message: {
					role: 'assistant',
					content: textContent || null,
					...(toolCalls.length > 0 && { tool_calls: toolCalls }),
				},
				finish_reason: finishReason as any,
			},
		],
		usage: {
			prompt_tokens: res.usage.input_tokens,
			completion_tokens: res.usage.output_tokens,
			total_tokens: res.usage.input_tokens + res.usage.output_tokens,
		},
	};
}

// ============================================================================
// OpenAI to Gemini Conversion
// ============================================================================

// Gemini content type for converter
type GeminiContentPart = {
	text?: string;
	inlineData?: { mimeType: string; data: string };
	functionCall?: unknown;
	functionResponse?: unknown;
};
type GeminiContent = { role: string; parts: GeminiContentPart[] };

/**
 * Convert OpenAI messages to Gemini contents
 */
export function openaiToGeminiContents(messages: ChatMessage[]): {
	systemInstruction?: GeminiContent;
	contents: GeminiContent[];
} {
	let systemInstruction: GeminiContent | undefined;
	const contents: GeminiContent[] = [];

	for (const msg of messages) {
		if (msg.role === 'system' || msg.role === 'developer') {
			// Gemini uses systemInstruction
			const text = typeof msg.content === 'string' ? msg.content : '';
			if (systemInstruction) {
				// Append to existing
				systemInstruction.parts.push({ text });
			} else {
				systemInstruction = {
					role: 'user' as const, // Gemini system instruction doesn't have role, but we use 'user'
					parts: [{ text }],
				};
			}
		} else if (msg.role === 'user') {
			const contentArr = Array.isArray(msg.content) ? msg.content : null;
			const parts =
				typeof msg.content === 'string'
					? [{ text: msg.content }]
					: (contentArr ?? []).map((c: any) => {
							if (c.type === 'text') {
								return { text: c.text };
							} else if (c.type === 'image_url') {
								const url = c.image_url.url;
								if (url.startsWith('data:')) {
									const match = url.match(/^data:([^;]+);base64,(.+)$/);
									if (match) {
										return {
											inlineData: {
												mimeType: match[1],
												data: match[2],
											},
										};
									}
								}
								return { fileData: { fileUri: url } };
							}
							return { text: '' };
						});
			contents.push({ role: 'user' as const, parts });
		} else if (msg.role === 'assistant') {
			if (msg.tool_calls && msg.tool_calls.length > 0) {
				const parts = msg.tool_calls.map((tc: any) => ({
					functionCall: {
						name: tc.function.name,
						args: JSON.parse(tc.function.arguments || '{}'),
					},
				}));
				if (msg.content) {
					const textContent = typeof msg.content === 'string' ? msg.content : '';
					parts.unshift({ text: textContent } as any);
				}
				contents.push({ role: 'model' as const, parts });
			} else {
				const textContent = typeof msg.content === 'string' ? msg.content : '';
				contents.push({ role: 'model' as const, parts: [{ text: textContent || '' }] });
			}
		} else if (msg.role === 'tool') {
			// Convert to function response
			const contentStr = typeof msg.content === 'string' ? msg.content : '';
			contents.push({
				role: 'user' as const,
				parts: [
					{
						functionResponse: {
							name: 'function', // We don't have the function name in tool message
							response: { result: contentStr },
						},
					},
				],
			});
		}
	}

	return { systemInstruction, contents };
}

/**
 * Convert OpenAI request to Gemini request
 */
export function openaiToGeminiRequest(req: CreateChatCompletionRequest): CreateGenerateContentRequest {
	const { systemInstruction, contents } = openaiToGeminiContents(req.messages);

	const geminiReq: CreateGenerateContentRequest = {
		contents: contents as CreateGenerateContentRequest['contents'],
	};

	if (systemInstruction) {
		geminiReq.systemInstruction = systemInstruction as CreateGenerateContentRequest['systemInstruction'];
	}

	const generationConfig: any = {};

	if (req.temperature !== undefined) {
		generationConfig.temperature = req.temperature;
	}
	if (req.top_p !== undefined) {
		generationConfig.topP = req.top_p;
	}
	if (req.max_tokens || req.max_completion_tokens) {
		generationConfig.maxOutputTokens = req.max_tokens || req.max_completion_tokens;
	}
	if (req.stop) {
		generationConfig.stopSequences = Array.isArray(req.stop) ? req.stop : [req.stop];
	}
	if (req.n) {
		generationConfig.candidateCount = req.n;
	}

	if (Object.keys(generationConfig).length > 0) {
		geminiReq.generationConfig = generationConfig;
	}

	if (req.tools && req.tools.length > 0) {
		geminiReq.tools = [
			{
				functionDeclarations: req.tools.map((tool: any) => ({
					name: tool.function.name,
					description: tool.function.description,
					parameters: tool.function.parameters,
				})),
			},
		];

		if (req.tool_choice) {
			if (req.tool_choice === 'auto') {
				geminiReq.toolConfig = { functionCallingConfig: { mode: 'AUTO' } };
			} else if (req.tool_choice === 'required') {
				geminiReq.toolConfig = { functionCallingConfig: { mode: 'ANY' } };
			} else if (req.tool_choice === 'none') {
				geminiReq.toolConfig = { functionCallingConfig: { mode: 'NONE' } };
			} else if (typeof req.tool_choice === 'object') {
				geminiReq.toolConfig = {
					functionCallingConfig: {
						mode: 'ANY',
						allowedFunctionNames: [req.tool_choice.function.name],
					},
				};
			}
		}
	}

	return geminiReq;
}

/**
 * Convert Gemini response to OpenAI response
 */
export function geminiToOpenaiResponse(
	res: CreateGenerateContentResponse,
	model: string,
): CreateChatCompletionResponse {
	const choices = (res.candidates || []).map((candidate: any, index: number) => {
		const toolCalls: any[] = [];
		let textContent = '';

		for (const part of candidate.content?.parts || []) {
			if ('text' in part) {
				textContent += part.text;
			} else if ('functionCall' in part) {
				toolCalls.push({
					id: `call_${Date.now()}_${index}`,
					type: 'function',
					function: {
						name: part.functionCall.name,
						arguments: JSON.stringify(part.functionCall.args),
					},
				});
			}
		}

		const finishReason = (() => {
			switch (candidate.finishReason) {
				case 'STOP':
					return 'stop';
				case 'MAX_TOKENS':
					return 'length';
				case 'SAFETY':
					return 'content_filter';
				default:
					return 'stop';
			}
		})();

		return {
			index: candidate.index ?? index,
			message: {
				role: 'assistant' as const,
				content: textContent || null,
				...(toolCalls.length > 0 && { tool_calls: toolCalls }),
			},
			finish_reason: finishReason as any,
		};
	});

	return {
		id: `gemini-${Date.now()}`,
		object: 'chat.completion',
		created: Math.floor(Date.now() / 1000),
		model,
		choices,
		usage: res.usageMetadata
			? {
					prompt_tokens: res.usageMetadata.promptTokenCount || 0,
					completion_tokens: res.usageMetadata.candidatesTokenCount || 0,
					total_tokens: res.usageMetadata.totalTokenCount || 0,
				}
			: undefined,
	};
}
