import type { ChatMessage, GenerateContentResponse, MessagesResponse } from '@wener/ai/schema';
import { describe, expect, it } from 'vitest';
import {
	anthropicToOpenaiResponse,
	geminiToOpenaiResponse,
	openaiToAnthropicMessages,
	openaiToAnthropicRequest,
	openaiToGeminiContents,
	openaiToGeminiRequest,
} from './converters';

describe('OpenAI to Anthropic conversion', () => {
	it('should convert system message to system prompt', () => {
		const messages: ChatMessage[] = [
			{ role: 'system', content: 'You are a helpful assistant.' },
			{ role: 'user', content: 'Hello!' },
		];

		const result = openaiToAnthropicMessages(messages);

		expect(result.system).toBe('You are a helpful assistant.');
		expect(result.messages).toHaveLength(1);
		expect(result.messages[0]).toEqual({ role: 'user', content: 'Hello!' });
	});

	it('should merge multiple system messages', () => {
		const messages: ChatMessage[] = [
			{ role: 'system', content: 'You are helpful.' },
			{ role: 'system', content: 'Be concise.' },
			{ role: 'user', content: 'Hi' },
		];

		const result = openaiToAnthropicMessages(messages);

		expect(result.system).toBe('You are helpful.\n\nBe concise.');
	});

	it('should convert tool calls to tool_use blocks', () => {
		const messages: ChatMessage[] = [
			{ role: 'user', content: 'What is the weather?' },
			{
				role: 'assistant',
				content: null,
				tool_calls: [
					{
						id: 'call_123',
						type: 'function',
						function: {
							name: 'get_weather',
							arguments: '{"location": "NYC"}',
						},
					},
				],
			},
		];

		const result = openaiToAnthropicMessages(messages);

		expect(result.messages[1]).toEqual({
			role: 'assistant',
			content: [
				{
					type: 'tool_use',
					id: 'call_123',
					name: 'get_weather',
					input: { location: 'NYC' },
				},
			],
		});
	});

	it('should convert tool message to tool_result', () => {
		const messages: ChatMessage[] = [
			{ role: 'user', content: 'What is the weather?' },
			{ role: 'tool', tool_call_id: 'call_123', content: 'Sunny, 72°F' },
		];

		const result = openaiToAnthropicMessages(messages);

		expect(result.messages[1]).toEqual({
			role: 'user',
			content: [
				{
					type: 'tool_result',
					tool_use_id: 'call_123',
					content: 'Sunny, 72°F',
				},
			],
		});
	});

	it('should convert full request with tools', () => {
		const request = {
			model: 'claude-3-opus',
			messages: [
				{ role: 'system' as const, content: 'You are helpful.' },
				{ role: 'user' as const, content: 'Hi' },
			],
			max_tokens: 1024,
			temperature: 0.7,
			tools: [
				{
					type: 'function' as const,
					function: {
						name: 'get_weather',
						description: 'Get weather info',
						parameters: {
							type: 'object',
							properties: { location: { type: 'string' } },
							required: ['location'],
						},
					},
				},
			],
			tool_choice: 'auto' as const,
		};

		const result = openaiToAnthropicRequest(request);

		expect(result.model).toBe('claude-3-opus');
		expect(result.system).toBe('You are helpful.');
		expect(result.max_tokens).toBe(1024);
		expect(result.temperature).toBe(0.7);
		expect(result.tools).toHaveLength(1);
		expect(result.tools?.[0].name).toBe('get_weather');
		expect(result.tool_choice).toEqual({ type: 'auto' });
	});
});

describe('Anthropic to OpenAI conversion', () => {
	it('should convert text response', () => {
		const response: MessagesResponse = {
			id: 'msg_123',
			type: 'message',
			role: 'assistant',
			content: [{ type: 'text', text: 'Hello there!' }],
			model: 'claude-3-opus',
			stop_reason: 'end_turn',
			usage: { input_tokens: 10, output_tokens: 5 },
		};

		const result = anthropicToOpenaiResponse(response, 'claude-3-opus');

		expect(result.id).toBe('msg_123');
		expect(result.object).toBe('chat.completion');
		expect(result.choices[0].message.content).toBe('Hello there!');
		expect(result.choices[0].finish_reason).toBe('stop');
		expect(result.usage).toEqual({
			prompt_tokens: 10,
			completion_tokens: 5,
			total_tokens: 15,
		});
	});

	it('should convert tool use response', () => {
		const response: MessagesResponse = {
			id: 'msg_456',
			type: 'message',
			role: 'assistant',
			content: [
				{
					type: 'tool_use',
					id: 'tool_123',
					name: 'get_weather',
					input: { location: 'NYC' },
				},
			],
			model: 'claude-3-opus',
			stop_reason: 'tool_use',
			usage: { input_tokens: 20, output_tokens: 10 },
		};

		const result = anthropicToOpenaiResponse(response, 'claude-3-opus');

		expect(result.choices[0].finish_reason).toBe('tool_calls');
		expect(result.choices[0].message.tool_calls).toHaveLength(1);
		expect(result.choices[0].message.tool_calls?.[0]).toEqual({
			id: 'tool_123',
			type: 'function',
			function: {
				name: 'get_weather',
				arguments: '{"location":"NYC"}',
			},
		});
	});
});

describe('OpenAI to Gemini conversion', () => {
	it('should convert system message to systemInstruction', () => {
		const messages: ChatMessage[] = [
			{ role: 'system', content: 'You are a helpful assistant.' },
			{ role: 'user', content: 'Hello!' },
		];

		const result = openaiToGeminiContents(messages);

		expect(result.systemInstruction).toBeDefined();
		expect(result.systemInstruction?.parts[0]).toEqual({ text: 'You are a helpful assistant.' });
		expect(result.contents).toHaveLength(1);
		expect(result.contents[0].role).toBe('user');
	});

	it('should convert assistant messages to model role', () => {
		const messages: ChatMessage[] = [
			{ role: 'user', content: 'Hi' },
			{ role: 'assistant', content: 'Hello!' },
		];

		const result = openaiToGeminiContents(messages);

		expect(result.contents[1].role).toBe('model');
		expect(result.contents[1].parts[0]).toEqual({ text: 'Hello!' });
	});

	it('should convert tool calls to functionCall', () => {
		const messages: ChatMessage[] = [
			{ role: 'user', content: 'Weather?' },
			{
				role: 'assistant',
				content: null,
				tool_calls: [
					{
						id: 'call_1',
						type: 'function',
						function: { name: 'get_weather', arguments: '{"city":"NYC"}' },
					},
				],
			},
		];

		const result = openaiToGeminiContents(messages);

		expect(result.contents[1].parts[0]).toEqual({
			functionCall: { name: 'get_weather', args: { city: 'NYC' } },
		});
	});

	it('should convert full request', () => {
		const request = {
			model: 'gemini-pro',
			messages: [
				{ role: 'system' as const, content: 'Be helpful.' },
				{ role: 'user' as const, content: 'Hello' },
			],
			temperature: 0.8,
			max_tokens: 500,
			tools: [
				{
					type: 'function' as const,
					function: {
						name: 'search',
						description: 'Search the web',
						parameters: { type: 'object', properties: { q: { type: 'string' } } },
					},
				},
			],
		};

		const result = openaiToGeminiRequest(request);

		expect(result.systemInstruction).toBeDefined();
		expect(result.generationConfig?.temperature).toBe(0.8);
		expect(result.generationConfig?.maxOutputTokens).toBe(500);
		expect(result.tools).toHaveLength(1);
		expect(result.tools?.[0]?.functionDeclarations?.[0]?.name).toBe('search');
	});
});

describe('Gemini to OpenAI conversion', () => {
	it('should convert text response', () => {
		const response: GenerateContentResponse = {
			candidates: [
				{
					content: {
						role: 'model',
						parts: [{ text: 'Hello!' }],
					},
					finishReason: 'STOP',
					index: 0,
				},
			],
			usageMetadata: {
				promptTokenCount: 10,
				candidatesTokenCount: 5,
				totalTokenCount: 15,
			},
		};

		const result = geminiToOpenaiResponse(response, 'gemini-pro');

		expect(result.object).toBe('chat.completion');
		expect(result.choices[0].message.content).toBe('Hello!');
		expect(result.choices[0].finish_reason).toBe('stop');
		expect(result.usage?.total_tokens).toBe(15);
	});

	it('should convert function call response', () => {
		const response: GenerateContentResponse = {
			candidates: [
				{
					content: {
						role: 'model',
						parts: [
							{
								functionCall: {
									name: 'get_weather',
									args: { location: 'NYC' },
								},
							},
						],
					},
					finishReason: 'STOP',
					index: 0,
				},
			],
		};

		const result = geminiToOpenaiResponse(response, 'gemini-pro');

		expect(result.choices[0].message.tool_calls).toHaveLength(1);
		expect(result.choices[0].message.tool_calls?.[0]?.function?.name).toBe('get_weather');
	});
});
