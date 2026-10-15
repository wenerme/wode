import { describe, expect, test } from 'vitest';
import * as publicEntry from '..';
import {
	GenerateMessageWireContentPartSchema,
	GenerateMessageWireRequestSchema,
	GenerateMessageWireResponseSchema,
	GenerateMessageWireSchema,
	GenerateMessageWireStreamEventSchema,
	GenerateMessageWireUsageSchema,
	GenericUsageSchema,
} from './index';

const extension = { future: { enabled: false, values: [null, 0, ''] } };
const chatMessage = { role: 'user', content: [{ type: 'text', text: '', ...extension }], ...extension };
const responseMessage = {
	type: 'message',
	role: 'assistant',
	content: [{ type: 'output_text', text: 'hello', annotations: [], ...extension }],
	...extension,
};
const anthropicMessage = { role: 'user', content: [{ type: 'text', text: 'hello', ...extension }], ...extension };
const geminiContent = { role: 'user', parts: [{ text: 'hello', ...extension }], ...extension };

const chatResponse = {
	id: 'chat-1',
	object: 'chat.completion',
	created: 1,
	model: 'gpt-4.1',
	choices: [{ index: 0, message: { role: 'assistant', content: 'hello', ...extension }, finish_reason: 'stop' }],
	usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3, ...extension },
	...extension,
};
const responsesResponse = {
	id: 'resp-1',
	object: 'response',
	created_at: 1,
	model: 'gpt-4.1',
	status: 'completed',
	output: [responseMessage],
	usage: { input_tokens: 2, output_tokens: 1, total_tokens: 3, ...extension },
	error: null,
	...extension,
};
const anthropicResponse = {
	id: 'msg-1',
	type: 'message',
	role: 'assistant',
	model: 'claude-sonnet-4',
	content: [{ type: 'text', text: 'hello', ...extension }],
	stop_reason: 'end_turn',
	stop_sequence: null,
	usage: { input_tokens: 2, output_tokens: 1, ...extension },
	...extension,
};
const geminiResponse = {
	candidates: [{ content: geminiContent, finishReason: 'STOP', ...extension }],
	usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 1, totalTokenCount: 3, ...extension },
	responseId: 'gemini-1',
	...extension,
};

describe('GenerateMessage 原生 wire 联合', () => {
	test('保留公开模块入口并导出同一组 schemas', () => {
		expect(publicEntry.GenerateMessageWireRequestSchema).toBe(GenerateMessageWireRequestSchema);
		expect(publicEntry.GenerateMessageWireContentPartSchema).toBe(GenerateMessageWireContentPartSchema);
		expect(publicEntry.GenericUsageSchema).toBe(GenericUsageSchema);
	});

	test.each([
		['Chat Completions', { model: 'gpt-4.1', messages: [chatMessage], stream: false, ...extension }],
		['Responses', { model: 'gpt-4.1', input: [responseMessage], store: false, ...extension }],
		['Anthropic Messages', { model: 'claude-sonnet-4', max_tokens: 32, messages: [anthropicMessage], ...extension }],
		['Gemini GenerateContent', { contents: [geminiContent], generationConfig: { temperature: 0 }, ...extension }],
	])('%s 请求逐层保留字段和值', (_protocol, input) => {
		expect(GenerateMessageWireRequestSchema.parse(input)).toStrictEqual(input);
	});

	test.each([
		['Chat Completions', chatResponse],
		['Responses', responsesResponse],
		['Anthropic Messages', anthropicResponse],
		['Gemini GenerateContent', geminiResponse],
	])('%s 响应逐层保留字段和值', (_protocol, input) => {
		expect(GenerateMessageWireResponseSchema.parse(input)).toStrictEqual(input);
	});

	test.each([
		[
			'Chat Completions',
			{
				id: 'chat-1',
				object: 'chat.completion.chunk',
				created: 1,
				model: 'gpt-4.1',
				choices: [{ index: 0, delta: { content: '', ...extension }, finish_reason: null, ...extension }],
				usage: null,
				...extension,
			},
		],
		['Responses', { type: 'response.completed', sequence_number: 0, response: responsesResponse, ...extension }],
		['Anthropic Messages', { type: 'message_start', message: anthropicResponse, ...extension }],
		['Gemini GenerateContent', geminiResponse],
	])('%s 流事件保留原结构', (_protocol, input) => {
		expect(GenerateMessageWireStreamEventSchema.parse(input)).toStrictEqual(input);
	});

	test.each([
		{},
		chatResponse.usage,
		responsesResponse.usage,
		anthropicResponse.usage,
		geminiResponse.usageMetadata,
		{ cache_creation: {}, input_tokens_details: {}, output_tokens_details: {}, ...extension },
		{ cache_creation_input_tokens: null, cache_read_input_tokens: 0 },
		{ input_tokens: null, output_tokens: 0, output_tokens_details: null },
	])('usage 不注入计数或缓存默认值：%j', (input) => {
		expect(GenerateMessageWireUsageSchema).toBe(GenericUsageSchema);
		expect(GenerateMessageWireUsageSchema.parse(input)).toStrictEqual(input);
	});

	test.each([chatMessage, responseMessage, anthropicMessage, geminiContent])('消息保留原结构：%j', (input) => {
		expect(GenerateMessageWireSchema.parse(input)).toStrictEqual(input);
	});

	test.each([
		{ type: 'text', text: '', ...extension },
		{ type: 'output_text', text: '', annotations: [], ...extension },
		{ type: 'thinking', thinking: '', signature: '', ...extension },
		{ text: '', thought: false, ...extension },
	])('内容保留原结构：%j', (input) => {
		expect(GenerateMessageWireContentPartSchema.parse(input)).toStrictEqual(input);
	});

	test.each([[null], [[]], ['hello'], [0]])('拒绝非对象 wire 输入：%j', (input) => {
		for (const schema of [
			GenerateMessageWireRequestSchema,
			GenerateMessageWireResponseSchema,
			GenerateMessageWireStreamEventSchema,
		]) {
			expect(schema.safeParse(input).success).toBe(false);
		}
	});

	test('沿用官方 Responses 可省略字段及空 input 的结构', () => {
		expect(GenerateMessageWireRequestSchema.parse({})).toStrictEqual({});
		for (const input of ['', [], null]) {
			const request = { model: 'gpt-4.1', input };
			expect(GenerateMessageWireRequestSchema.parse(request)).toStrictEqual(request);
		}
		expect(GenerateMessageWireResponseSchema.parse({})).toStrictEqual({});
		expect(GenerateMessageWireStreamEventSchema.parse({})).toStrictEqual({});
	});
});
