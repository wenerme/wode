import { describe, expect, test } from 'vitest';
import {
	OpenAIChatCompletionsChunkSchema,
	OpenAIChatCompletionsRequestSchema,
	OpenAIChatCompletionsResponseSchema,
	OpenAIChatCompletionsStreamEventSchema,
	OpenAIChatCompletionUsageSchema,
	OpenAIChatToolChoiceSchema,
} from './OpenAIChatCompletionsSchema';

describe('OpenAI Chat Completions schemas', () => {
	test('HTTP 200 SSE error envelopes preserve fields without inventing completion choices', () => {
		const error = {
			error: { message: 'quota exceeded', type: 'rate_limit_error', code: null, param: null, provider_detail: true },
			request_id: 'req_test',
		};
		expect(OpenAIChatCompletionsStreamEventSchema.parse(error)).toStrictEqual(error);
		expect(OpenAIChatCompletionsChunkSchema.safeParse(error).success).toBe(false);
	});

	test('ChatCompletion 官方可选字段和空字符串解析后原样保留', () => {
		const request = {
			model: '',
			messages: [
				{ role: 'assistant' },
				{ role: 'assistant', tool_calls: null, function_call: { name: '', arguments: '' } },
				{
					role: 'user',
					content: [
						{ type: 'file', file: {} },
						{ type: 'input_audio', input_audio: { data: '', format: 'wav' } },
					],
				},
				{ role: 'function', name: '', content: null },
			],
			max_tokens: -1,
			max_completion_tokens: 0,
			n: null,
			tools: [{ type: 'function', function: { name: '', strict: null } }],
			tool_choice: {
				type: 'allowed_tools',
				allowed_tools: { mode: 'auto', tools: [{ type: 'function', function: { name: '' }, extra: true }] },
			},
		};
		expect(OpenAIChatCompletionsRequestSchema.parse(request)).toStrictEqual(request);
	});

	test('ChatCompletion 已知消息、内容块和工具不完整时由 fallback 原样保留', () => {
		for (const message of [
			{ role: 'user', extension: { trace: true } },
			{ role: 'function', content: null },
			{ role: 'assistant', function_call: { name: '' } },
			{ role: 'user', content: [{ type: 'file', file: { file_data: 1 } }] },
			{ role: 'user', content: [{ type: 'text', extension: { keep: 'it' } }] },
		]) {
			const request = { model: '', messages: [message] };
			expect(OpenAIChatCompletionsRequestSchema.parse(request)).toStrictEqual(request);
		}
		expect(
			OpenAIChatCompletionsRequestSchema.safeParse({ model: '', messages: [{ role: 'assistant' }], tools: [{}] })
				.success,
		).toBe(false);
		for (const tools of [[{ type: 'function' }], [{ type: 'function', function: {} }]]) {
			const request = { model: '', messages: [{ role: 'assistant' }], tools };
			expect(OpenAIChatCompletionsRequestSchema.parse(request)).toStrictEqual(request);
		}
		expect(OpenAIChatCompletionsRequestSchema.safeParse({ model: '', messages: [] }).success).toBe(false);
		expect(
			OpenAIChatCompletionsRequestSchema.parse({
				model: '',
				messages: [{ role: 'assistant' }],
				n: 0,
				top_logprobs: -1,
			}),
		).toMatchObject({ n: 0, top_logprobs: -1 });
	});

	test('ChatCompletion allowed_tools 精确校验包装结构并保留工具扩展', () => {
		for (const mode of ['auto', 'required']) {
			const choice = { type: 'allowed_tools', allowed_tools: { mode, tools: [{ extension: null }, {}] } };
			expect(OpenAIChatToolChoiceSchema.parse(choice)).toStrictEqual(choice);
		}
		const providerChoice = { type: 'allowed_tools', allowed_tools: { mode: 'provider-mode', tools: [null] } };
		expect(OpenAIChatToolChoiceSchema.parse(providerChoice)).toStrictEqual(providerChoice);
		expect(OpenAIChatToolChoiceSchema.parse({ type: 'provider-tool-choice', extension: 1 })).toStrictEqual({
			type: 'provider-tool-choice',
			extension: 1,
		});
	});

	test('ChatCompletion stream 支持全部角色及省略结束原因', () => {
		for (const role of ['developer', 'system', 'user', 'assistant', 'tool', 'function', 'provider-role']) {
			for (const ending of [{}, { finish_reason: null }, { finish_reason: 'stop' }]) {
				const chunk = {
					id: '',
					object: 'chat.completion.chunk',
					created: -1,
					model: '',
					choices: [{ index: -1, delta: { role }, ...ending }],
				};
				expect(OpenAIChatCompletionsChunkSchema.parse(chunk)).toStrictEqual(chunk);
			}
		}
		const response = {
			id: 'chat-1',
			object: 'provider.chat.completion',
			created: 0,
			model: 'provider-model',
			choices: [{ index: 0, message: { role: 'provider-role', extension: true }, finish_reason: 'provider-finished' }],
		};
		expect(OpenAIChatCompletionsResponseSchema.parse(response)).toStrictEqual(response);
	});

	test('CompletionUsage 详情允许 null 且不生成默认字段', () => {
		for (const details of [
			{},
			{ prompt_tokens_details: null, completion_tokens_details: null },
			{
				prompt_tokens_details: { cached_tokens: 0, extension: true },
				completion_tokens_details: { reasoning_tokens: 1 },
			},
		]) {
			const usage = { prompt_tokens: 0, completion_tokens: 1, total_tokens: 1, ...details };
			expect(OpenAIChatCompletionUsageSchema.parse(usage)).toStrictEqual(usage);
		}
	});

	test('旧版 function_call 可单独作为 assistant 内容，且不完整调用也能保留', () => {
		const assistant = { role: 'assistant', function_call: { name: 'lookup', arguments: '{}' } };
		expect(
			OpenAIChatCompletionsRequestSchema.parse({
				model: 'local/legacy',
				messages: [assistant],
				functions: [{ name: 'lookup', parameters: { type: 'object' } }],
				function_call: { name: 'lookup' },
			}).messages,
		).toHaveLength(1);
		expect(
			OpenAIChatCompletionsResponseSchema.parse({
				id: 'chat-1',
				object: 'chat.completion',
				created: 1,
				model: 'local/legacy',
				choices: [{ index: 0, message: assistant, finish_reason: 'function_call' }],
			}).choices[0].message.function_call,
		).toMatchObject({ name: 'lookup', arguments: '{}' });
		expect(
			OpenAIChatCompletionsRequestSchema.parse({
				model: 'local/legacy',
				messages: [{ role: 'assistant', function_call: { name: 'lookup' } }],
			}),
		).toMatchObject({ messages: [{ function_call: { name: 'lookup' } }] });
	});

	test('旧版 function_call SSE 可只携带 arguments 的片段', () => {
		expect(
			OpenAIChatCompletionsChunkSchema.parse({
				id: 'chat-1',
				object: 'chat.completion.chunk',
				created: 1,
				model: 'local/legacy',
				choices: [{ index: 0, delta: { function_call: { arguments: '{' } }, finish_reason: null }],
			}).choices[0].delta.function_call,
		).toEqual({ arguments: '{' });
	});

	test('官方非usage stream chunk允许usage为null', () => {
		expect(
			OpenAIChatCompletionsChunkSchema.parse({
				id: 'chunk-1',
				object: 'chat.completion.chunk',
				created: 1,
				model: 'gpt-test',
				choices: [{ index: 0, delta: { role: 'assistant', content: 'ok' }, finish_reason: null }],
				usage: null,
			}),
		).toMatchObject({ usage: null });
	});
});
