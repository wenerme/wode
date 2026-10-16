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
	test('官方 number 时间戳保留小数，不额外要求整数', () => {
		const response = { id: 'resp-1', object: 'response', created_at: 1.5, model: 'm', output: [] };
		expect(OpenAIResponsesResponseSchema.parse(response)).toStrictEqual(response);
	});

	test('已知内置工具不完整时由 fallback 原样保留，tool_choice 保留 provider 值', () => {
		for (const tool of [{ type: 'file_search' }, { type: 'code_interpreter' }]) {
			const request = { model: 'local/assistant', input: 'hi', tools: [tool] };
			expect(OpenAIResponsesRequestSchema.parse(request)).toStrictEqual(request);
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
		expect(
			OpenAIResponsesRequestSchema.parse({
				model: 'local/assistant',
				input: 'hi',
				tool_choice: 'provider-mode',
				max_output_tokens: 0,
			}),
		).toMatchObject({ tool_choice: 'provider-mode', max_output_tokens: 0 });
	});

	test('Responses 已知内容、条目和事件不完整时保留扩展字段', () => {
		const request = {
			input: [{ type: 'message', role: 'provider-role', content: [{ type: 'input_text', extension: true }] }],
		};
		expect(OpenAIResponsesRequestSchema.parse(request)).toStrictEqual(request);

		const response = {
			id: 'resp-1',
			object: 'provider.response',
			created_at: 1,
			model: 'm',
			output: [{ type: 'function_call', extension: { keep: true } }],
			status: 'provider-status',
		};
		expect(OpenAIResponsesResponseSchema.parse(response)).toStrictEqual(response);

		const event = { type: 'response.completed', extension: { keep: true } };
		expect(OpenAIResponsesStreamEventSchema.parse(event)).toStrictEqual(event);
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

	test('Responses 输入条目引用可省略 type，并保留原始字段', () => {
		for (const item of [{ id: 'item-1' }, { type: 'item_reference', id: 'item-1', extension: { keep: null } }]) {
			const request = { input: [item] };
			expect(OpenAIResponsesRequestSchema.parse(request)).toStrictEqual(request);
			expect(OpenAIResponsesInputTokensRequestSchema.parse(request)).toStrictEqual(request);
		}
		expect(OpenAIResponsesRequestSchema.parse({ input: [{ type: 'item_reference' }] })).toStrictEqual({
			input: [{ type: 'item_reference' }],
		});
	});

	test('Responses output 保留响应条目结构并保留官方工具结果资源', () => {
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
		const result = { ...base, output: [{ type: 'function_call_output', call_id: 'call-1', output: 'result' }] };
		expect(OpenAIResponsesResponseSchema.parse(result)).toStrictEqual(result);
		const resource = { ...base, output: [{ type: 'function_call_output', id: 'item-1', output: 'result' }] };
		expect(OpenAIResponsesResponseSchema.parse(resource)).toStrictEqual(resource);
	});

	test('解析响应', () => {
		expect(
			OpenAIResponsesInputTokensResponseSchema.parse({ object: 'response.input_tokens', input_tokens: 42 }),
		).toEqual({ object: 'response.input_tokens', input_tokens: 42 });
	});
});
