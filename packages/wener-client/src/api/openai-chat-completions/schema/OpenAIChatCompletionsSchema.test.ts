import { describe, expect, test } from 'vitest';
import {
	OpenAIChatCompletionsChunkSchema,
	OpenAIChatCompletionsRequestSchema,
	OpenAIChatCompletionsResponseSchema,
} from './OpenAIChatCompletionsSchema';

describe('OpenAI Chat Completions schemas', () => {
	test('旧版 function_call 可单独作为 assistant 内容，且校验完整调用字段', () => {
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
			OpenAIChatCompletionsRequestSchema.safeParse({
				model: 'local/legacy',
				messages: [{ role: 'assistant', function_call: { name: 'lookup' } }],
			}).success,
		).toBe(false);
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
