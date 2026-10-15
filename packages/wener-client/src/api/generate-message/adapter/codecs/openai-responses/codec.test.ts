import { describe, expect, it } from 'vitest';
import {
	OpenAIResponseErrorSchema,
	OpenAIResponsesRequestSchema,
	type OpenAIResponsesResponse,
	OpenAIResponsesResponseSchema,
	OpenAIResponsesStreamEventSchema,
} from '../../../../openai-responses/schema';
import { ApiType } from '../../../../schema/ApiType';
import { createGenerateMessageAdapterContext } from '../../context';
import type { GenerateMessageRequest, GenerateMessageResponse, GenerateMessageStreamEvent } from '../../types';
import { OpenAIResponsesCodec as codec } from './codec';

const API = ApiType.OpenAIResponses;
const OTHER = ApiType.AnthropicMessages;
function context(source: ApiType = API, target: ApiType = API) {
	let id = 0;
	return createGenerateMessageAdapterContext({
		source,
		target,
		model: 'test-model',
		generateId: (prefix) => `${prefix}_${++id}`,
		now: () => 1700000000,
	});
}
function response(output: unknown[], extras: Record<string, unknown> = {}): OpenAIResponsesResponse {
	return OpenAIResponsesResponseSchema.parse({
		id: 'resp_input',
		object: 'response',
		model: 'test-model',
		created_at: 1700000000,
		status: 'completed',
		output,
		...extras,
	});
}
const requests: Record<string, unknown> = {
	'string input and instructions': { model: 'm', input: 'Hello', instructions: 'Be brief', stream: false },
	'absent input': { previous_response_id: 'resp_prev' },
	'null input and settings': {
		input: null,
		instructions: null,
		stream: null,
		max_output_tokens: null,
		parallel_tool_calls: null,
		temperature: null,
		top_p: null,
		metadata: null,
		user: null,
		reasoning: null,
		text: null,
	},
	'empty input and configuration objects': { input: [], tools: [], reasoning: {}, text: {} },
	'message type omission, strings and unknown roles': {
		input: [
			{ role: 'system', content: 'policy', future: 1 },
			{ type: 'message', role: 'developer', content: [{ type: 'text', text: 'dev' }] },
			{ role: 'future-role', content: 'str' },
			{ role: 'user', content: [] },
		],
	},
	'function and custom definitions and native tools': {
		input: 'use tools',
		tools: [
			{ type: 'function', name: 'weather', description: null, parameters: { type: 'object' }, strict: null, future: 1 },
			{
				type: 'custom',
				name: 'shell',
				description: 'run',
				format: { type: 'grammar', syntax: 'lark', definition: 'start: WORD' },
				future: 2,
			},
			{ type: 'file_search', vector_store_ids: ['vs_1'] },
			{ type: 'code_interpreter', container: { type: 'auto' } },
			{ type: 'web_search', location: 'auto' },
		],
		tool_choice: { type: 'custom', name: 'shell', extra: true },
		parallel_tool_calls: true,
	},
	'function tool choice': { input: 'x', tool_choice: { type: 'function', name: 'f', future: 2 } },
	'native tool choice': {
		input: 'x',
		tool_choice: { type: 'allowed_tools', tools: [{ type: 'function', name: 'f' }] },
	},
	'parallel calls and grouped results': {
		input: [
			{
				type: 'message',
				role: 'assistant',
				id: 'msg_1',
				status: 'completed',
				content: [{ type: 'output_text', text: 'calling' }],
			},
			{
				type: 'function_call',
				call_id: 'c1',
				name: 'f',
				arguments: '{ "a": 1 }',
				id: 'fc1',
				status: 'completed',
				extra: 1,
			},
			{ type: 'custom_tool_call', call_id: 'c2', name: 'shell', input: 'ls -la', id: 'fc2' },
			{ type: 'function_call_output', call_id: 'c1', output: 'ok' },
			{
				type: 'custom_tool_call_output',
				call_id: 'c2',
				output: [{ type: 'input_text', text: 'file' }],
				status: 'completed',
			},
		],
	},
	'multimodal and nested extensions': {
		input: [
			{
				role: 'user',
				content: [
					{ type: 'input_image', image_url: 'https://example.com/image', detail: 'high', future: 'image' },
					{ type: 'image', image_url: null, file_id: 'file_1' },
					{
						type: 'input_file',
						file_id: 'file_2',
						filename: 'a.pdf',
						file_data: 'YWJj',
						file_url: 'https://example.com/a',
						future: true,
					},
					{ type: 'input_audio', input_audio: { data: 'YWJj', format: 'wav', codec: 'pcm' }, extra: true },
					{ type: 'input_text', text: 'describe', cache_control: { type: 'ephemeral' } },
				],
			},
		],
	},
	'reasoning segments and encrypted signature': {
		input: [
			{
				type: 'reasoning',
				id: 'rs1',
				status: 'completed',
				encrypted_content: 'opaque',
				summary: [
					{ type: 'summary_text', text: 'one', extra: 1 },
					{ type: 'summary_text', text: 'two' },
					{ type: 'future_summary', value: 3 },
				],
				content: [
					{ type: 'reasoning_text', text: 'think ', extension: 1 },
					{ type: 'reasoning_text', text: 'more' },
				],
				future: 9,
			},
			{ type: 'message', role: 'assistant', content: [{ type: 'refusal', refusal: 'no', reason: 'policy' }] },
		],
		reasoning: { effort: 'high', summary: null, future: true },
	},
	'unknown items and blocks': {
		input: [
			{ type: 'compaction', id: null, encrypted_content: 'opaque', extra: 1 },
			{ id: 'msg_reused' },
			{ type: 'item_reference', id: 'msg_reused2' },
			{ type: 'future_item', data: { a: 1 } },
			{ role: 'user', content: [{ type: 'future_block', data: [1, 2] }] },
		],
		include: ['reasoning.encrypted_content'],
		store: false,
		truncation: 'auto',
		background: false,
		prompt_cache_key: 'cache',
		previous_response_id: null,
		future: { a: 1 },
	},
	'response format and complete generation settings': {
		model: 'm',
		input: 'json',
		max_output_tokens: 128,
		temperature: 0.3,
		top_p: 0.9,
		tool_choice: 'auto',
		user: 'u',
		metadata: { trace: 'a' },
		text: {
			format: {
				type: 'json_schema',
				name: 'answer',
				schema: { type: 'object' },
				strict: true,
				description: 'answer',
				extra: 1,
			},
			verbosity: 'low',
			extra: 2,
		},
	},
	'json object format': { input: 'x', text: { format: { type: 'json_object', extra: 1 } } },
	'text format': { input: 'x', text: { format: { type: 'text' }, verbosity: null } },
	'unknown format': { input: 'x', text: { format: { type: 'future_format', value: 1 } } },
	'empty adjacent assistant items': {
		input: [
			{ type: 'message', role: 'assistant', content: [], id: 'a' },
			{ type: 'message', role: 'assistant', content: 'hello', id: 'b' },
			{ type: 'message', role: 'assistant', content: [], id: 'c' },
			{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'bye' }], id: 'd' },
		],
	},
};
const responses: Record<string, OpenAIResponsesResponse> = {
	'text output': response(
		[
			{
				type: 'message',
				role: 'assistant',
				id: 'msg1',
				status: 'completed',
				content: [
					{
						type: 'output_text',
						text: 'hello',
						annotations: [{ type: 'url_citation', url: 'https://example.com' }],
						logprobs: [],
						extra: 1,
					},
				],
				extra: 2,
			},
		],
		{ extra: 3 },
	),
	'string output and adjacent messages': response([
		{ type: 'message', role: 'assistant', content: 'a', id: 'a' },
		{ type: 'message', role: 'assistant', content: 'b', id: 'b' },
	]),
	'parallel calls': response([
		{ type: 'function_call', id: 'fc1', call_id: 'call1', name: 'f', arguments: '{}' },
		{ type: 'custom_tool_call', id: 'fc2', call_id: 'call2', name: 'shell', input: 'pwd' },
	]),
	reasoning: response([
		{
			type: 'reasoning',
			id: 'rs1',
			encrypted_content: 'secret',
			summary: [{ type: 'summary_text', text: 'summary', extra: 1 }],
			content: [
				{ type: 'reasoning_text', text: 'a' },
				{ type: 'reasoning_text', text: 'b' },
			],
		},
	]),
	refusal: response([{ type: 'message', role: 'assistant', content: [{ type: 'refusal', refusal: 'No' }] }]),
	'unknown and compaction': response([
		{ type: 'compaction', id: 'cmp1', encrypted_content: 'opaque' },
		{ type: 'future_item', extra: 1 },
		{ type: 'message', role: 'assistant', content: [{ type: 'future_block', value: 2 }] },
	]),
	'usage extensions': response([], {
		usage: {
			input_tokens: 10,
			output_tokens: 7,
			total_tokens: 17,
			input_tokens_details: { cached_tokens: 4, extra: 1 },
			output_tokens_details: { reasoning_tokens: 3, extra: 2 },
			extra: 3,
		},
		tools: [],
		text: { format: { type: 'text' } },
		reasoning: null,
		instructions: null,
		temperature: 1,
	}),
	'incomplete length': response([], {
		status: 'incomplete',
		incomplete_details: { reason: 'max_output_tokens', extra: 1 },
		usage: null,
		error: null,
	}),
	'incomplete filter': response([], { status: 'incomplete', incomplete_details: { reason: 'content_filter' } }),
	failed: response([], {
		status: 'failed',
		error: { code: 'server_error', type: 'server_error', message: 'Oops', param: null },
	}),
	queued: response([], { status: 'queued' }),
	cancelled: response([], { status: 'cancelled', incomplete_details: null }),
	'non-assistant message role': response([
		{ type: 'message', role: 'future-role', content: 'content' },
		{ type: 'function_call_output', output: 'result' },
	]),
	'unknown response envelope object': OpenAIResponsesResponseSchema.parse({
		id: 'resp_future',
		object: 'provider.response',
		model: 'test-model',
		created_at: 1700000001,
		status: 'completed',
		output: [],
	}),
};

describe('OpenAI Responses request and response mapping', () => {
	for (const [name, value] of Object.entries(requests))
		it(`request round trip: ${name}`, () => {
			const wire = OpenAIResponsesRequestSchema.parse(value);
			const original = structuredClone(wire);
			const ctx = context();
			const decoded = codec.decodeRequest(wire, ctx);
			const encoded = codec.encodeRequest(decoded, ctx);
			expect(encoded).toStrictEqual(wire);
			expect(wire).toStrictEqual(original);
			OpenAIResponsesRequestSchema.parse(encoded);
			expect(ctx.diagnostics).toEqual([]);
		});
	for (const [name, wire] of Object.entries(responses))
		it(`response round trip: ${name}`, () => {
			const original = structuredClone(wire);
			const ctx = context();
			const encoded = codec.encodeResponse(codec.decodeResponse(wire, ctx), ctx);
			expect(encoded).toStrictEqual(wire);
			expect(wire).toStrictEqual(original);
			OpenAIResponsesResponseSchema.parse(encoded);
			expect(ctx.diagnostics).toEqual([]);
		});
	it('exposes nested unknown fields to cross-protocol processors', () => {
		const request = codec.decodeRequest(
			OpenAIResponsesRequestSchema.parse(requests['multimodal and nested extensions']),
			context(),
		);
		expect(request.messages[0].content[3].extensions?.[API]).toMatchObject({ input_audio: { codec: 'pcm' } });
		const common = codec.decodeResponse(responses['text output'], context());
		expect(common.choices[0].message.extensions?.[API]).toMatchObject({ items: { '0': { id: 'msg1', extra: 2 } } });
		const usage = codec.decodeResponse(responses['usage extensions'], context()).usage;
		expect(usage?.extensions?.[API]).toMatchObject({
			input_tokens_details: { extra: 1 },
			output_tokens_details: { extra: 2 },
		});
		const reasoning = codec.decodeResponse(responses.reasoning, context()).choices[0].message.content[0];
		expect(reasoning.extensions?.[API]).toMatchObject({ summary: [{ fields: { extra: 1 } }] });
	});
	it('preserves incomplete unknown audio blocks as native values', () => {
		const wire = OpenAIResponsesRequestSchema.parse({
			input: [{ role: 'user', content: [{ type: 'input_audio', input_audio: { format: 'wav', future: true } }] }],
		});
		const common = codec.decodeRequest(wire, context());
		expect(common.messages[0].content[0].type).toBe('native');
		expect(codec.encodeRequest(common, context())).toStrictEqual(wire);
	});
	it('preserves absent status and does not inject request defaults', () => {
		const wire = response([]);
		delete wire.status;
		expect(codec.encodeResponse(codec.decodeResponse(wire, context()), context())).toStrictEqual(wire);
		expect(codec.encodeRequest(codec.decodeRequest({}, context()), context())).toStrictEqual({});
	});
	it('groups assistant items and tool outputs, exposes all mapped semantics', () => {
		const common = codec.decodeRequest(
			OpenAIResponsesRequestSchema.parse(requests['parallel calls and grouped results']),
			context(),
		);
		expect(common.messages.map((m) => [m.role, m.content.map((p) => p.type)])).toEqual([
			['assistant', ['text', 'tool-call', 'tool-call']],
			['tool', ['tool-result', 'tool-result']],
		]);
		const decoded = codec.decodeRequest(
			OpenAIResponsesRequestSchema.parse(requests['response format and complete generation settings']),
			context(),
		);
		expect(decoded).toMatchObject({
			maxOutputTokens: 128,
			responseFormat: { type: 'json_schema', name: 'answer', strict: true },
			extensions: { [API]: { text: { verbosity: 'low' } } },
		});
	});
	it('edits mapped content without stale wire snapshots overriding it', () => {
		const ctx = context();
		const common = codec.decodeRequest(
			OpenAIResponsesRequestSchema.parse(requests['reasoning segments and encrypted signature']),
			ctx,
		);
		const part = common.messages[0].content[0];
		if (part.type !== 'reasoning') throw new Error('Expected reasoning');
		part.text = 'updated reasoning';
		part.summary = ['new one', 'new two', 'new three'];
		const encoded = codec.encodeRequest(common, ctx);
		const decoded = codec.decodeRequest(encoded, ctx).messages[0].content[0];
		expect(decoded).toMatchObject({
			type: 'reasoning',
			text: 'updated reasoning',
			summary: ['new one', 'new two', 'new three'],
		});
	});
	it('maps token counts without subtracting cache or reasoning tokens', () => {
		const common = codec.decodeResponse(responses['usage extensions'], context());
		expect(common.usage).toMatchObject({
			inputTokens: 10,
			outputTokens: 7,
			totalTokens: 17,
			cachedInputTokens: 4,
			reasoningTokens: 3,
		});
	});
	it.each([
		['parallel calls', 'tool-calls'],
		['text output', 'stop'],
		['incomplete length', 'length'],
		['incomplete filter', 'content-filter'],
		['failed', 'error'],
	] as const)('maps finish reason %s', (name, reason) => {
		expect(codec.decodeResponse(responses[name], context()).choices[0].finishReason).toBe(reason);
	});
	it('encodes cross-protocol messages and reports unrepresentable fields', () => {
		const request: GenerateMessageRequest = {
			model: 'm',
			system: [
				{ type: 'text', text: 'first' },
				{ type: 'text', text: 'second' },
			],
			messages: [
				{ role: 'system', content: [{ type: 'text', text: 'system message' }] },
				{
					role: 'user',
					content: [
						{ type: 'text', text: 'question' },
						{
							type: 'tool-result',
							toolCallId: 'call1',
							content: [
								{ type: 'text', text: 'answer' },
								{ type: 'image', data: 'YWJj', mediaType: 'image/png' },
							],
							isError: true,
						},
					],
				},
				{ role: 'developer', content: [{ type: 'text', text: 'middle developer' }] },
				{
					role: 'assistant',
					content: [
						{
							type: 'reasoning',
							text: 'thinking',
							signature: { api: OTHER, value: 'secret' },
							extensions: { [OTHER]: { cache_control: {} } },
						},
						{
							type: 'tool-call',
							id: 'call2',
							name: 'shell',
							arguments: 'pwd',
							toolType: 'custom',
							signature: { api: ApiType.GoogleGenerativeAI, value: 'sig' },
						},
						{ type: 'native', api: OTHER, value: { type: 'future' } },
						{ type: 'refusal', text: 'no' },
					],
				},
				{ role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call2', content: 'ok' }] },
			],
			tools: [
				{ type: 'function', name: 'f', parameters: { type: 'object' }, extensions: { [OTHER]: { cache_control: {} } } },
				{ type: 'native', api: OTHER, value: {} },
			],
			toolChoice: { type: 'native', api: OTHER, value: {} },
			topK: 3,
			extensions: { [OTHER]: { beta: true } },
		};
		const ctx = context(OTHER);
		const wire = codec.encodeRequest(request, ctx);
		OpenAIResponsesRequestSchema.parse(wire);
		expect(wire.instructions).toBe('first\n\nsecond');
		expect(wire.input).toEqual(
			expect.arrayContaining([
				{ type: 'function_call_output', call_id: 'call2', output: 'ok' },
				{ type: 'message', role: 'developer', content: [{ type: 'input_text', text: 'middle developer' }] },
			]),
		);
		expect(JSON.stringify(wire)).not.toContain('secret');
		expect(ctx.diagnostics).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: 'lossy', path: 'system' }),
				expect.objectContaining({ code: 'drop', path: 'messages[3].content[0].signature' }),
				expect.objectContaining({ code: 'drop', path: 'topK' }),
				expect.objectContaining({ code: 'drop', path: 'request.beta' }),
			]),
		);
		expect(ctx.diagnostics.some((d) => d.code === 'reorder')).toBe(false);
	});
	it('encodes cross-protocol responses and drops extra candidates', () => {
		const common: GenerateMessageResponse = {
			model: 'm',
			choices: [
				{
					index: 0,
					message: {
						role: 'assistant',
						content: [
							{ type: 'reasoning', text: 'visible', summary: ['summary'], signature: { api: OTHER, value: 'foreign' } },
							{ type: 'text', text: 'answer', extensions: { [OTHER]: { citation: true } } },
						],
					},
					finishReason: 'length',
					extensions: { [OTHER]: { extra: 1 } },
				},
				{ index: 1, message: { role: 'assistant', content: [] } },
			],
			usage: {
				inputTokens: 5,
				outputTokens: 3,
				totalTokens: 8,
				cachedInputTokens: 2,
				reasoningTokens: 1,
				cacheWriteInputTokens: 1,
			},
		};
		const ctx = context(OTHER);
		const wire = codec.encodeResponse(common, ctx);
		OpenAIResponsesResponseSchema.parse(wire);
		expect(wire).toMatchObject({
			id: 'resp_1',
			created_at: 1700000000,
			status: 'incomplete',
			incomplete_details: { reason: 'max_output_tokens' },
		});
		expect(ctx.diagnostics).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: 'drop', path: 'choices[1]' }),
				expect.objectContaining({ code: 'drop', path: 'usage.cacheWriteInputTokens' }),
			]),
		);
	});
	it('fills missing model and usage counts with diagnosed placeholders', () => {
		const ctx = context();
		ctx.model = undefined;
		const encoded = codec.encodeResponse({ choices: [], usage: { inputTokens: 1 } }, ctx);
		OpenAIResponsesResponseSchema.parse(encoded);
		expect(encoded.model).toBe('');
		expect(encoded.usage).toEqual({ input_tokens: 1, output_tokens: 0, total_tokens: 0 });
		expect(ctx.diagnostics).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: 'lossy', path: 'model' }),
				expect.objectContaining({ code: 'lossy', path: 'usage.outputTokens' }),
				expect.objectContaining({ code: 'lossy', path: 'usage.totalTokens' }),
			]),
		);
	});
	it('derives total tokens when both counts are available', () => {
		const ctx = context();
		const encoded = codec.encodeResponse({ model: 'm', choices: [], usage: { inputTokens: 4, outputTokens: 3 } }, ctx);
		OpenAIResponsesResponseSchema.parse(encoded);
		expect(encoded.usage).toEqual({ input_tokens: 4, output_tokens: 3, total_tokens: 7 });
		expect(ctx.diagnostics).toEqual([expect.objectContaining({ code: 'lossy', path: 'usage.totalTokens' })]);
	});
});

function runStream(values: Record<string, unknown>[], ctx = context()) {
	const decoder = codec.createStreamDecoder(ctx);
	const encoder = codec.createStreamEncoder(ctx);
	const common: GenerateMessageStreamEvent[] = [];
	for (const value of values) common.push(...decoder.push(OpenAIResponsesStreamEventSchema.parse(value)));
	common.push(...decoder.end());
	const wire = common.flatMap((e) => encoder.push(e));
	wire.push(...encoder.end());
	for (const e of wire) OpenAIResponsesStreamEventSchema.parse(e);
	expect(wire.map((e) => e.sequence_number)).toEqual(wire.map((_, i) => i));
	expect(decoder.end()).toEqual([]);
	expect(encoder.end()).toEqual([]);
	return { common, wire, ctx };
}
const ev = (type: string, fields: Record<string, unknown> = {}) => ({ type, sequence_number: 0, ...fields });
function terminal(wire: ReturnType<typeof runStream>['wire']) {
	return wire.at(-1)?.response as OpenAIResponsesResponse;
}

describe('OpenAI Responses stream', () => {
	it('reports and ignores a repeated upstream terminal event', () => {
		const ctx = context();
		const decoder = codec.createStreamDecoder(ctx);
		const terminalEvent = ev('response.completed', { response: response([]) });
		expect(decoder.push(terminalEvent as never).filter((event) => event.type === 'finish')).toHaveLength(1);
		expect(decoder.push(terminalEvent as never)).toEqual([]);
		expect(ctx.diagnostics).toContainEqual(expect.objectContaining({ code: 'lossy', path: 'stream.finish' }));
	});

	it('accepts only the first finish event', () => {
		const ctx = context();
		const encoder = codec.createStreamEncoder(ctx);
		const finish = { type: 'finish' as const, choice: 0, finishReason: 'stop' as const };
		expect(encoder.push(finish)).toEqual([]);
		expect(encoder.push(finish)).toEqual([]);
		const output = encoder.end();
		for (const event of output) OpenAIResponsesStreamEventSchema.parse(event);
		expect(output.filter((event) => event.type === 'response.completed')).toHaveLength(1);
		expect(ctx.diagnostics).toContainEqual(expect.objectContaining({ code: 'lossy', path: 'stream.0.finish' }));
	});

	it('uses request model and otherwise emits an empty model with a lossy diagnostic', () => {
		const ctx = context();
		ctx.model = undefined;
		ctx.request = { model: 'request-model', messages: [] };
		const encoder = codec.createStreamEncoder(ctx);
		const withRequestModel = [...encoder.push({ type: 'start' }), ...encoder.end()];
		expect(withRequestModel[0]).toMatchObject({ type: 'response.created', response: { model: 'request-model' } });

		const emptyCtx = context();
		emptyCtx.model = undefined;
		const emptyEncoder = codec.createStreamEncoder(emptyCtx);
		const output = [...emptyEncoder.push({ type: 'start' }), ...emptyEncoder.end()];
		expect(output[0]).toMatchObject({ type: 'response.created', response: { model: '' } });
		expect(emptyCtx.diagnostics).toEqual([expect.objectContaining({ code: 'lossy', path: 'model' })]);
	});

	it('round trips real text, parallel calls, summaries and reasoning increments', () => {
		const output = [
			{
				type: 'reasoning',
				id: 'rs1',
				summary: [{ type: 'summary_text', text: 'Let me think' }],
				content: [{ type: 'reasoning_text', text: 'reason' }],
				encrypted_content: 'opaque',
			},
			{
				type: 'message',
				id: 'msg1',
				role: 'assistant',
				status: 'completed',
				content: [{ type: 'output_text', text: 'Hello world', annotations: [] }],
			},
			{
				type: 'function_call',
				id: 'fc1',
				call_id: 'call1',
				name: 'weather',
				arguments: '{"city":"Paris"}',
				status: 'completed',
			},
			{ type: 'function_call', id: 'fc2', call_id: 'call2', name: 'time', arguments: '{}', status: 'completed' },
		];
		const events = [
			ev('response.created', { response: response([], { status: 'in_progress' }) }),
			ev('response.in_progress', { response: response([], { status: 'in_progress' }) }),
			ev('response.output_item.added', { output_index: 0, item: { type: 'reasoning', id: 'rs1', summary: [] } }),
			ev('response.reasoning_summary_part.added', {
				output_index: 0,
				item_id: 'rs1',
				summary_index: 0,
				part: { type: 'summary_text', text: '' },
			}),
			ev('response.reasoning_summary_text.delta', {
				output_index: 0,
				item_id: 'rs1',
				summary_index: 0,
				delta: 'Let me ',
			}),
			ev('response.reasoning_summary_text.delta', {
				output_index: 0,
				item_id: 'rs1',
				summary_index: 0,
				delta: 'think',
			}),
			ev('response.reasoning_summary_text.done', {
				output_index: 0,
				item_id: 'rs1',
				summary_index: 0,
				text: 'Let me think',
			}),
			ev('response.reasoning_text.delta', { output_index: 0, item_id: 'rs1', content_index: 0, delta: 'reason' }),
			ev('response.output_item.done', { output_index: 0, item: output[0] }),
			ev('response.output_item.added', {
				output_index: 1,
				item: { type: 'message', role: 'assistant', id: 'msg1', content: [], status: 'in_progress' },
			}),
			ev('response.content_part.added', {
				output_index: 1,
				item_id: 'msg1',
				content_index: 0,
				part: { type: 'output_text', text: '', annotations: [] },
			}),
			ev('response.output_text.delta', { output_index: 1, item_id: 'msg1', content_index: 0, delta: 'Hello ' }),
			ev('response.output_text.delta', { output_index: 1, item_id: 'msg1', content_index: 0, delta: 'world' }),
			ev('response.output_text.done', { output_index: 1, item_id: 'msg1', content_index: 0, text: 'Hello world' }),
			ev('response.content_part.done', {
				output_index: 1,
				item_id: 'msg1',
				content_index: 0,
				part: output[1].content?.[0],
			}),
			ev('response.output_item.done', { output_index: 1, item: output[1] }),
			ev('response.output_item.added', {
				output_index: 2,
				item: { ...output[2], arguments: '', status: 'in_progress' },
			}),
			ev('response.output_item.added', {
				output_index: 3,
				item: { ...output[3], arguments: '', status: 'in_progress' },
			}),
			ev('response.function_call_arguments.delta', { output_index: 2, item_id: 'fc1', delta: '{"city":' }),
			ev('response.function_call_arguments.delta', { output_index: 3, item_id: 'fc2', delta: '{}' }),
			ev('response.function_call_arguments.delta', { output_index: 2, item_id: 'fc1', delta: '"Paris"}' }),
			ev('response.function_call_arguments.done', { output_index: 2, item_id: 'fc1', arguments: '{"city":"Paris"}' }),
			ev('response.output_item.done', { output_index: 2, item: output[2] }),
			ev('response.output_item.done', { output_index: 3, item: output[3] }),
			ev('response.completed', {
				response: response(output, { usage: { input_tokens: 10, output_tokens: 8, total_tokens: 18 } }),
			}),
		];
		const { wire, common, ctx } = runStream(events);
		expect(common.filter((e) => e.type === 'start')).toHaveLength(1);
		expect(common.filter((e) => e.type === 'part-start')).toHaveLength(4);
		expect(common.filter((e) => e.type === 'part-end')).toHaveLength(4);
		expect(terminal(wire)).toMatchObject({
			status: 'completed',
			output: [
				expect.objectContaining({
					type: 'reasoning',
					summary: [{ type: 'summary_text', text: 'Let me think' }],
					encrypted_content: 'opaque',
				}),
				expect.objectContaining({
					type: 'message',
					content: [{ type: 'output_text', text: 'Hello world', annotations: [] }],
				}),
				expect.objectContaining({ type: 'function_call', arguments: '{"city":"Paris"}' }),
				expect.objectContaining({ type: 'function_call', arguments: '{}' }),
			],
			usage: { input_tokens: 10, output_tokens: 8, total_tokens: 18 },
		});
		expect(
			wire
				.filter((e) => e.type === 'response.output_text.delta')
				.map((e) => e.delta)
				.join(''),
		).toBe('Hello world');
		expect(
			wire
				.filter((e) => e.type === 'response.function_call_arguments.delta' && e.output_index === 2)
				.map((e) => e.delta)
				.join(''),
		).toBe('{"city":"Paris"}');
		expect(ctx.diagnostics).toEqual([]);
	});
	it('uses output and content indexes independently and closes truncated streams', () => {
		const { common, wire } = runStream([
			ev('response.output_item.added', {
				output_index: 0,
				item: { type: 'message', id: 'm', role: 'assistant', content: [] },
			}),
			ev('response.content_part.added', {
				output_index: 0,
				item_id: 'm',
				content_index: 0,
				part: { type: 'output_text', text: '' },
			}),
			ev('response.content_part.added', {
				output_index: 0,
				item_id: 'm',
				content_index: 1,
				part: { type: 'refusal', refusal: '' },
			}),
			ev('response.output_text.delta', { output_index: 0, item_id: 'm', content_index: 0, delta: 'answer' }),
			ev('response.refusal.delta', { output_index: 0, item_id: 'm', content_index: 1, delta: 'no' }),
			ev('response.refusal.done', { output_index: 0, item_id: 'm', content_index: 1, refusal: 'no' }),
		]);
		expect(common.filter((e) => e.type === 'part-start').map((e) => e.index)).toEqual([0, 1]);
		expect(common.some((e) => e.type === 'finish')).toBe(false);
		expect(new Set(terminal(wire).output.map((item) => item.id)).size).toBe(2);
		expect(terminal(wire)).toMatchObject({
			status: 'incomplete',
			output: [
				expect.objectContaining({ content: [{ type: 'output_text', text: 'answer' }] }),
				expect.objectContaining({ content: [{ type: 'refusal', refusal: 'no' }] }),
			],
		});
	});
	it.each(['incomplete', 'failed'] as const)('flushes %s and usage from terminal response', (status) => {
		const { wire } = runStream([
			ev(`response.${status}`, {
				response: response([], {
					status,
					incomplete_details: status === 'incomplete' ? { reason: 'max_output_tokens' } : null,
					usage: { input_tokens: 1, output_tokens: 2, total_tokens: 3 },
				}),
			}),
		]);
		expect(terminal(wire)).toMatchObject({ status, usage: { total_tokens: 3 } });
	});
	it('handles custom tool input, done-only text and unknown events', () => {
		const { wire } = runStream([
			ev('response.output_item.added', {
				output_index: 0,
				item: { type: 'custom_tool_call', call_id: 'c', name: 'shell', input: '' },
			}),
			ev('response.custom_tool_call_input.delta', { output_index: 0, item_id: 'fc', delta: 'pwd' }),
			ev('response.custom_tool_call_input.done', { output_index: 0, item_id: 'fc', input: 'pwd' }),
			ev('response.output_text.done', { output_index: 1, item_id: 'm', content_index: 0, text: 'complete' }),
			ev('response.future', { payload: 1 }),
		]);
		expect(terminal(wire).output).toEqual([
			expect.objectContaining({ type: 'custom_tool_call', input: 'pwd' }),
			expect.objectContaining({ content: [{ type: 'output_text', text: 'complete' }] }),
		]);
		expect(wire.some((e) => e.type === 'response.future' && e.payload === 1)).toBe(true);
	});
	it('encodes foreign events, ignores foreign native events and never leaks signatures', () => {
		const ctx = context(OTHER);
		const encoder = codec.createStreamEncoder(ctx);
		const events: GenerateMessageStreamEvent[] = [
			{ type: 'native', api: OTHER, value: {} },
			{ type: 'start', model: 'm' },
			{
				type: 'part-start',
				choice: 0,
				index: 0,
				part: { type: 'reasoning', text: '', signature: { api: OTHER, value: 'foreign' } },
			},
			{ type: 'part-delta', choice: 0, index: 0, delta: { text: 'thinking', signature: 'more' } },
			{ type: 'part-start', choice: 1, index: 0, part: { type: 'text', text: 'ignored' } },
			{ type: 'usage', usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 } },
			{ type: 'finish', choice: 0, finishReason: 'stop' },
		];
		const wire = [...events.flatMap((e) => encoder.push(e)), ...encoder.end()];
		wire.forEach((e) => OpenAIResponsesStreamEventSchema.parse(e));
		expect(JSON.stringify(wire)).not.toContain('foreign');
		expect(terminal(wire).usage?.total_tokens).toBe(3);
		expect(ctx.diagnostics.some((d) => d.path.endsWith('.signature'))).toBe(true);
	});
	it('keeps summary indexes distinct and synthesizes missing final deltas', () => {
		const { wire } = runStream([
			ev('response.output_item.added', { output_index: 0, item: { type: 'reasoning', id: 'rs1', summary: [] } }),
			ev('response.reasoning_summary_text.delta', {
				output_index: 0,
				item_id: 'rs1',
				summary_index: 0,
				delta: 'first',
			}),
			ev('response.reasoning_summary_text.delta', {
				output_index: 0,
				item_id: 'rs1',
				summary_index: 1,
				delta: 'second',
			}),
			ev('response.reasoning_summary_text.done', {
				output_index: 0,
				item_id: 'rs1',
				summary_index: 1,
				text: 'second complete',
			}),
			ev('response.reasoning_part.added', {
				output_index: 0,
				item_id: 'rs1',
				content_index: 0,
				part: { type: 'reasoning_text', text: '' },
			}),
			ev('response.reasoning_part.done', {
				output_index: 0,
				item_id: 'rs1',
				content_index: 0,
				part: { type: 'reasoning_text', text: 'thought' },
			}),
		]);
		const deltas = wire.filter((e) => e.type === 'response.reasoning_summary_text.delta');
		expect(
			deltas
				.filter((e) => e.summary_index === 0)
				.map((e) => e.delta)
				.join(''),
		).toBe('first');
		expect(
			deltas
				.filter((e) => e.summary_index === 1)
				.map((e) => e.delta)
				.join(''),
		).toBe('second complete');
		expect(terminal(wire).output[0]).toMatchObject({
			id: 'rs1',
			summary: [
				{ type: 'summary_text', text: 'first' },
				{ type: 'summary_text', text: 'second complete' },
			],
			content: [{ type: 'reasoning_text', text: 'thought' }],
		});
	});
	it('honors the upstream model and emits initial text and final snapshot remainders', () => {
		const ctx = context();
		const encoder = codec.createStreamEncoder(ctx);
		const events: GenerateMessageStreamEvent[] = [
			{ type: 'start', model: 'upstream-model' },
			{ type: 'part-start', choice: 0, index: 0, part: { type: 'text', text: 'initial' } },
			{ type: 'part-end', choice: 0, index: 0, part: { type: 'text', text: 'initial final' } },
			{ type: 'finish', choice: 0, finishReason: 'stop' },
		];
		const wire = [...events.flatMap((e) => encoder.push(e)), ...encoder.end()];
		wire.forEach((e) => OpenAIResponsesStreamEventSchema.parse(e));
		expect(terminal(wire).model).toBe('upstream-model');
		expect(
			wire
				.filter((e) => e.type === 'response.output_text.delta')
				.map((e) => e.delta)
				.join(''),
		).toBe('initial final');
		expect(ctx.diagnostics).toEqual([]);
	});
	it('keeps unknown content blocks inside their message items', () => {
		const { wire } = runStream([
			ev('response.output_item.done', {
				output_index: 0,
				item: { type: 'message', id: 'm', role: 'assistant', content: [{ type: 'future_block', data: 1 }] },
			}),
		]);
		expect(terminal(wire).output[0]).toMatchObject({ type: 'message', content: [{ type: 'future_block', data: 1 }] });
	});
	it('decodes and encodes nested and flat stream errors', () => {
		for (const fields of [
			{ error: { type: 'server_error', code: null, param: null, message: 'Oops' } },
			{ code: 'rate_limit_exceeded', message: 'Slow down' },
		]) {
			const { wire, common } = runStream([ev('error', fields)]);
			expect(common[0].type).toBe('error');
			expect(wire[0].type).toBe('error');
			OpenAIResponseErrorSchema.parse(wire[0].error);
			expect(terminal(wire).status).toBe('failed');
		}
	});
});

describe('OpenAI Responses errors', () => {
	it.each([
		['invalid_request_error', 'invalid-request', 400],
		['authentication_error', 'authentication', 401],
		['permission_error', 'permission', 403],
		['not_found_error', 'not-found', 404],
		['rate_limit_exceeded', 'rate-limit', 429],
		['insufficient_quota', 'rate-limit', 429],
		['context_length_exceeded', 'context-length', 400],
		['server_error', 'server', 500],
	] as const)('maps and round trips %s', (type, kind, status) => {
		const body = { error: { message: 'Error', type, code: type, param: null, future: true }, trace: 't' };
		const ctx = context();
		const error = codec.decodeError({ status, body }, ctx);
		expect(error.kind).toBe(kind);
		expect(codec.encodeError(error, ctx)).toStrictEqual({ status, body });
		const foreign = codec.encodeError({ kind, message: 'foreign' }, ctx);
		OpenAIResponseErrorSchema.parse((foreign.body as { error: unknown }).error);
	});
	it('preserves colliding inner and outer error extension names', () => {
		const body = {
			error: { message: 'bad', envelope: { trace: 'inner' }, error: 'inner error' },
			envelope: 'outer',
			code: 'outer code',
		};
		const ctx = context();
		expect(codec.encodeError(codec.decodeError({ status: 400, body }, ctx), ctx)).toStrictEqual({ status: 400, body });
	});
	it('preserves null and absent type/code, and falls back to HTTP status', () => {
		for (const body of [
			{ error: { message: 'x', code: null, param: null } },
			{ error: { message: 'x' } },
			{ message: 'x', type: 'future_error', extra: 1 },
		]) {
			const ctx = context();
			const common = codec.decodeError({ status: 503, body }, ctx);
			expect(common.kind).toBe('overloaded');
			expect(codec.encodeError(common, ctx)).toStrictEqual({ status: 503, body });
		}
	});
});
