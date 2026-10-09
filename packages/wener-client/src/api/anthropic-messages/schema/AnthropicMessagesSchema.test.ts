import { describe, expect, test } from 'vitest';
import {
	AnthropicMessagesCountTokensRequestSchema,
	AnthropicMessagesCountTokensResponseSchema,
	AnthropicMessagesRequestSchema,
	AnthropicMessagesResponseSchema,
	AnthropicMessagesStreamEventSchema,
} from './AnthropicMessagesSchema';

describe('Anthropic Messages schemas', () => {
	test('解析多模态、tool和扩展请求字段', () => {
		const request = AnthropicMessagesRequestSchema.parse({
			model: 'claude-public',
			max_tokens: 1024,
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: 'describe' },
						{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AA==' } },
					],
				},
			],
			tools: [{ name: 'lookup', input_schema: { type: 'object' } }],
			thinking: { type: 'enabled', budget_tokens: 256 },
		});

		expect(request).toMatchObject({ model: 'claude-public', max_tokens: 1024 });
	});

	test('解析非流响应和usage分段stream events', () => {
		expect(
			AnthropicMessagesResponseSchema.parse({
				id: 'msg-1',
				container: null,
				type: 'message',
				role: 'assistant',
				content: [{ type: 'text', text: 'done' }],
				model: 'claude-private',
				stop_reason: 'end_turn',
				stop_details: null,
				stop_sequence: null,
				usage: {
					input_tokens: 8,
					output_tokens: 5,
					cache_creation_input_tokens: null,
					cache_read_input_tokens: 2,
					cache_creation: null,
					inference_geo: null,
					output_tokens_details: null,
					server_tool_use: null,
					service_tier: 'standard',
				},
			}),
		).toMatchObject({ usage: { input_tokens: 8, output_tokens: 5 } });

		expect(
			AnthropicMessagesStreamEventSchema.parse({
				type: 'message_delta',
				delta: { container: null, stop_details: null, stop_reason: 'end_turn', stop_sequence: null },
				usage: { output_tokens: 5 },
			}),
		).toMatchObject({ type: 'message_delta', usage: { output_tokens: 5 } });
	});
});

describe('Anthropic Messages Count Tokens schemas', () => {
	test('解析不含 max_tokens 的请求', () => {
		expect(
			AnthropicMessagesCountTokensRequestSchema.parse({
				model: 'claude-fable-5',
				messages: [{ role: 'user', content: 'hi' }],
			}),
		).toMatchObject({ model: 'claude-fable-5' });
	});

	test('解析响应并保留扩展字段', () => {
		expect(
			AnthropicMessagesCountTokensResponseSchema.parse({ input_tokens: 128, context_management: {} }),
		).toMatchObject({ input_tokens: 128 });
	});
});
