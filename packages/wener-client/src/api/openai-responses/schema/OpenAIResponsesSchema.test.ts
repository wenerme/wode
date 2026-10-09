import { describe, expect, test } from 'vitest';
import {
	OpenAIResponsesInputTokensRequestSchema,
	OpenAIResponsesInputTokensResponseSchema,
	OpenAIResponsesRequestSchema,
	OpenAIResponsesResponseSchema,
	OpenAIResponsesStreamEventSchema,
	OpenAIResponseUsageSchema,
} from './OpenAIResponsesSchema';

describe('OpenAI Responses schemas', () => {
	test('已知内置工具不能绕过必需字段，而 tool_choice 只需要类型', () => {
		for (const tool of [{ type: 'file_search' }, { type: 'code_interpreter' }]) {
			expect(
				OpenAIResponsesRequestSchema.safeParse({ model: 'local/assistant', input: 'hi', tools: [tool] }).success,
			).toBe(false);
		}
		expect(
			OpenAIResponsesRequestSchema.parse({
				model: 'local/assistant',
				input: 'hi',
				tool_choice: { type: 'file_search' },
				tools: [
					{ type: 'file_search', vector_store_ids: ['vs-1'] },
					{ type: 'code_interpreter', container: { type: 'auto', memory_limit: '4g' } },
				],
			}).tools,
		).toHaveLength(2);
		expect(
			OpenAIResponsesRequestSchema.parse({
				model: 'local/assistant',
				input: 'hi',
				tools: [{ type: 'code_interpreter', container: 'cntr-1' }],
			}).tools,
		).toHaveLength(1);
	});

	test('usage要求官方input/output details', () => {
		expect(
			OpenAIResponseUsageSchema.parse({
				input_tokens: 8,
				input_tokens_details: { cached_tokens: 2 },
				output_tokens: 5,
				output_tokens_details: { reasoning_tokens: 1 },
				total_tokens: 13,
			}),
		).toMatchObject({ input_tokens_details: { cached_tokens: 2 } });
	});

	test('解析带sequence_number的done事件', () => {
		expect(
			OpenAIResponsesStreamEventSchema.parse({
				type: 'response.output_text.done',
				sequence_number: 4,
				item_id: 'item-1',
				output_index: 0,
				content_index: 0,
				text: 'done',
			}),
		).toMatchObject({ type: 'response.output_text.done', sequence_number: 4 });
	});
});

describe('OpenAI Responses input schemas', () => {
	test('解析字符串与结构化输入请求', () => {
		expect(OpenAIResponsesInputTokensRequestSchema.parse({ model: 'gpt-5.6-terra', input: 'hi' })).toMatchObject({
			model: 'gpt-5.6-terra',
		});
		expect(
			OpenAIResponsesInputTokensRequestSchema.parse({
				model: 'gpt-5.6-terra',
				input: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: 'hi' }] }],
			}).input,
		).toHaveLength(1);
	});

	test('兼容省略message type的Responses输入', () => {
		expect(
			OpenAIResponsesRequestSchema.parse({
				model: 'gpt-5.6-luna',
				input: [
					{ role: 'developer', content: 'You are helpful.' },
					{ role: 'user', content: [{ type: 'input_text', text: 'Hello' }] },
				],
				stream: true,
				store: false,
				prompt_cache_key: 'session-1',
			}),
		).toMatchObject({ model: 'gpt-5.6-luna', stream: true });
	});

	test('允许Responses输入中的function call和tool result', () => {
		const input = [
			{ type: 'function_call', call_id: 'call-1', name: 'bash', arguments: '{"command":"pwd"}' },
			{ type: 'function_call_output', call_id: 'call-1', output: '/tmp' },
		] as const;
		expect(OpenAIResponsesRequestSchema.parse({ model: 'gpt-5.6-luna', input }).input).toHaveLength(2);
		expect(OpenAIResponsesInputTokensRequestSchema.parse({ model: 'gpt-5.6-luna', input }).input).toHaveLength(2);
	});

	test('Responses output要求message带type且不接受tool result', () => {
		const base = {
			id: 'resp-1',
			object: 'response' as const,
			created_at: 1,
			model: 'gpt-5.6-luna',
			status: 'completed' as const,
		};
		expect(
			OpenAIResponsesResponseSchema.safeParse({ ...base, output: [{ role: 'assistant', content: 'Hello' }] }).success,
		).toBe(false);
		expect(
			OpenAIResponsesResponseSchema.safeParse({
				...base,
				output: [{ type: 'function_call_output', call_id: 'call-1', output: 'result' }],
			}).success,
		).toBe(false);
	});

	test('解析响应', () => {
		expect(
			OpenAIResponsesInputTokensResponseSchema.parse({ object: 'response.input_tokens', input_tokens: 42 }),
		).toEqual({ object: 'response.input_tokens', input_tokens: 42 });
	});
});
