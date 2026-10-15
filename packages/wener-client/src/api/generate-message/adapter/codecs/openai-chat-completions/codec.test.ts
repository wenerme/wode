import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import {
	OpenAIChatCompletionsChunkSchema,
	type OpenAIChatCompletionsRequest,
	OpenAIChatCompletionsRequestSchema,
	type OpenAIChatCompletionsResponse,
	OpenAIChatCompletionsResponseSchema,
	OpenAIChatCompletionsStreamEventSchema,
} from '../../../../openai-chat-completions/schema';
import { ApiType } from '../../../../schema/ApiType';
import { createGenerateMessageAdapterContext } from '../../context';
import type { GenerateMessageDiagnostic, GenerateMessageRequest } from '../../types';
import { OpenAIChatCompletionsCodec as codec } from './codec';

const API = ApiType.OpenAIChatCompletions;
function makeCtx(source: ApiType = API, target: ApiType = API) {
	let n = 0;
	return createGenerateMessageAdapterContext({
		source,
		target,
		generateId: (prefix) => `${prefix}_${++n}`,
		now: () => 1700000000,
	});
}
function codes(diagnostics: GenerateMessageDiagnostic[]) {
	return diagnostics.map((item) => `${item.code}:${item.path}`);
}
function roundTripRequest(wire: OpenAIChatCompletionsRequest) {
	const input = structuredClone(wire);
	const ctx = makeCtx();
	const decoded = codec.decodeRequest(input, ctx);
	const encoded = codec.encodeRequest(decoded, ctx);
	expect(encoded).toStrictEqual(wire);
	OpenAIChatCompletionsRequestSchema.parse(encoded);
	expect(ctx.diagnostics).toEqual([]);
	return decoded;
}
function roundTripResponse(wire: OpenAIChatCompletionsResponse) {
	const input = structuredClone(wire);
	const ctx = makeCtx();
	const decoded = codec.decodeResponse(input, ctx);
	const encoded = codec.encodeResponse(decoded, ctx);
	expect(encoded).toStrictEqual(wire);
	OpenAIChatCompletionsResponseSchema.parse(encoded);
	expect(ctx.diagnostics).toEqual([]);
	return decoded;
}

const requestSamples: Record<string, OpenAIChatCompletionsRequest> = {
	plain: { model: 'gpt-chat', messages: [{ role: 'user', content: 'hello' }] },
	config: {
		model: 'gpt-chat',
		messages: [
			{ role: 'system', content: 'be brief' },
			{ role: 'developer', content: [{ type: 'text', text: 'json' }] },
			{ role: 'user', content: 'list' },
		],
		stream: false,
		temperature: 0.2,
		top_p: 0.8,
		stop: 'END',
		seed: 7,
		n: 2,
		presence_penalty: 0.1,
		frequency_penalty: 0.3,
		max_tokens: 100,
		reasoning_effort: 'low',
		user: 'u1',
		metadata: { team: 'a' },
		stream_options: { include_usage: true },
	},
	tools: {
		model: 'gpt-chat',
		messages: [{ role: 'user', content: 'call tools' }],
		tools: [
			{
				type: 'function',
				function: { name: 'weather', description: 'weather', parameters: { type: 'object' }, strict: true },
			},
			{ type: 'custom', custom: { name: 'regex', description: 'pattern', format: { type: 'grammar' } } },
		],
		tool_choice: { type: 'function', function: { name: 'weather' } },
		parallel_tool_calls: true,
	},
	media: {
		model: 'gpt-chat',
		messages: [
			{
				role: 'user',
				content: [
					{ type: 'text', text: 'inspect' },
					{ type: 'image_url', image_url: 'data:image/png;base64,abc' },
					{ type: 'image_url', image_url: { url: 'https://example.test/a.png', detail: 'high' } },
					{ type: 'input_audio', input_audio: { data: 'AAAA', format: 'wav' } },
					{ type: 'file', file: { file_id: 'file_1', filename: 'a.txt' } },
				],
			},
		],
	},
	assistant: {
		model: 'gpt-chat',
		messages: [
			{
				role: 'assistant',
				content: null,
				refusal: null,
				tool_calls: [
					{
						id: 'call_1',
						type: 'function',
						function: { name: 'weather', arguments: '{"city":"Paris"}' },
						extra_content: { google: { thought_signature: 'sig' }, future: true },
					},
					{ id: 'call_2', type: 'custom', custom: { name: 'regex', input: 'a+' } },
				],
			},
		],
	},
	toolResult: {
		model: 'gpt-chat',
		messages: [
			{
				role: 'assistant',
				content: [{ type: 'text', text: 'call' }],
				tool_calls: [{ id: 'c', type: 'function', function: { name: 'f', arguments: '{}' } }],
			},
			{ role: 'tool', tool_call_id: 'c', content: [{ type: 'text', text: '{"ok":true}' }] },
		],
	},
	unknown: {
		model: 'gpt-chat',
		messages: [{ role: 'user', content: [{ type: 'future_block', value: 1 }] }],
		functions: [{ name: 'old', parameters: { type: 'object' } }],
		function_call: { name: 'old' },
		logprobs: true,
		top_logprobs: 2,
		verbosity: 'high',
		future_top: { x: 1 },
		response_format: { type: 'text', future: true },
	},
	'unknown role': {
		model: 'gpt-chat',
		messages: [{ role: 'future-role', content: 'future content', future_message_field: { value: 1 } }],
	},
	jsonSchema: {
		model: 'gpt-chat',
		messages: [{ role: 'user', content: 'json' }],
		max_completion_tokens: 300,
		response_format: {
			type: 'json_schema',
			json_schema: { name: 'answer', description: 'd', schema: { type: 'object' }, strict: true, extra: 1 },
		},
	},
};

const responseSamples: Record<string, OpenAIChatCompletionsResponse> = {
	text: {
		id: 'chatcmpl_1',
		object: 'chat.completion',
		created: 1700000000,
		model: 'gpt-chat',
		choices: [{ index: 0, message: { role: 'assistant', content: 'hello' }, finish_reason: 'stop', logprobs: null }],
		usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
	},
	tools: {
		id: 'chatcmpl_2',
		object: 'chat.completion',
		created: 1700000001,
		model: 'gpt-chat',
		choices: [
			{
				index: 0,
				message: {
					role: 'assistant',
					content: [{ type: 'text', text: 'done' }],
					tool_calls: [{ id: 'c', type: 'function', function: { name: 'f', arguments: '{}' } }],
					reasoning_content: 'think',
					reasoning_details: [
						{ type: 'reasoning.text', text: 'think', signature: 's', format: 'openai-responses-v1', future: 1 },
					],
				},
				finish_reason: 'tool_calls',
				logprobs: { x: 1 },
			},
		],
		usage: {
			prompt_tokens: 10,
			completion_tokens: 8,
			total_tokens: 18,
			prompt_tokens_details: { cached_tokens: 2, audio_tokens: 1 },
			completion_tokens_details: { reasoning_tokens: 3, accepted_prediction_tokens: 1 },
		},
	},
	unknown: {
		id: 'chatcmpl_3',
		object: 'chat.completion',
		created: 1700000002,
		model: 'gpt-chat',
		choices: [
			{
				index: 0,
				message: { role: 'assistant', content: [{ type: 'future', x: 1 }] },
				finish_reason: 'future_reason',
				logprobs: { content: null },
			},
		],
		system_fingerprint: 'fp',
		service_tier: 'flex',
	},
	'unknown envelope': {
		id: 'chatcmpl_future',
		object: 'provider.chat.completion',
		created: 1700000003,
		model: 'gpt-chat',
		choices: [{ index: 0, message: { role: 'assistant', content: 'future' }, finish_reason: 'stop' }],
	},
};

describe('OpenAIChatCompletionsCodec request round trips', () => {
	for (const [name, wire] of Object.entries(requestSamples)) it(name, () => roundTripRequest(wire));
	it('maps common fields and preserves the two content shapes', () => {
		const request = roundTripRequest(requestSamples.config!);
		expect(request.stop).toEqual(['END']);
		expect(request.maxOutputTokens).toBe(100);
		expect(request.messages[0]?.content[0]).toMatchObject({ type: 'text', text: 'be brief' });
		const tools = roundTripRequest(requestSamples.tools!);
		expect(tools.tools?.map((tool) => tool.type)).toEqual(['function', 'custom']);
	});
});

describe('OpenAIChatCompletionsCodec response round trips', () => {
	for (const [name, wire] of Object.entries(responseSamples)) it(name, () => roundTripResponse(wire));
	it('maps finish reasons and usage details', () => {
		const response = roundTripResponse(responseSamples.tools!);
		expect(response.choices[0]?.finishReason).toBe('tool-calls');
		expect(response.usage).toMatchObject({
			inputTokens: 10,
			outputTokens: 8,
			totalTokens: 18,
			cachedInputTokens: 2,
			reasoningTokens: 3,
		});
	});
	it('generates required response metadata', () => {
		const ctx = makeCtx();
		const wire = codec.encodeResponse({ choices: [{ index: 0, message: { role: 'assistant', content: [] } }] }, ctx);
		expect(wire.id).toBe('chatcmpl_1');
		expect(wire.created).toBe(1700000000);
		OpenAIChatCompletionsResponseSchema.parse(wire);
	});
});

const streamInput = [
	{
		id: 'stream_1',
		object: 'chat.completion.chunk',
		created: 1700000000,
		model: 'gpt-chat',
		choices: [{ index: 0, delta: { role: 'assistant', reasoning_content: 'think' }, finish_reason: null }],
	},
	{
		id: 'stream_1',
		object: 'chat.completion.chunk',
		created: 1700000000,
		model: 'gpt-chat',
		choices: [{ index: 0, delta: { reasoning_content: ' more' }, finish_reason: null }],
	},
	{
		id: 'stream_1',
		object: 'chat.completion.chunk',
		created: 1700000000,
		model: 'gpt-chat',
		choices: [{ index: 0, delta: { content: 'Hello' }, finish_reason: null }],
	},
	{
		id: 'stream_1',
		object: 'chat.completion.chunk',
		created: 1700000000,
		model: 'gpt-chat',
		choices: [{ index: 0, delta: { content: ' world' }, finish_reason: null }],
	},
	{
		id: 'stream_1',
		object: 'chat.completion.chunk',
		created: 1700000000,
		model: 'gpt-chat',
		choices: [
			{
				index: 0,
				delta: {
					tool_calls: [
						{ index: 0, id: 'call_1', type: 'function', function: { name: 'weather', arguments: '{"city":' } },
					],
				},
				finish_reason: null,
			},
		],
	},
	{
		id: 'stream_1',
		object: 'chat.completion.chunk',
		created: 1700000000,
		model: 'gpt-chat',
		choices: [
			{
				index: 0,
				delta: { tool_calls: [{ index: 0, function: { arguments: '"Paris"}' } }] },
				finish_reason: 'tool_calls',
			},
		],
	},
	{
		id: 'stream_1',
		object: 'chat.completion.chunk',
		created: 1700000000,
		model: 'gpt-chat',
		choices: [],
		usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 },
	},
] as unknown as Array<z.infer<typeof OpenAIChatCompletionsChunkSchema>>;

describe('OpenAIChatCompletionsCodec stream', () => {
	it('decodes a 200 SSE error without creating a start event', () => {
		const ctx = makeCtx();
		const decoder = codec.createStreamDecoder(ctx);
		const events = decoder.push({ error: { message: 'quota', type: 'rate_limit_exceeded' } } as never);
		expect(events.map((event) => event.type)).toEqual(['error']);
		const encoder = codec.createStreamEncoder(ctx);
		const output = events.flatMap((event) => encoder.push(event));
		expect(output).toHaveLength(1);
		expect(output[0]).toMatchObject({ error: { message: 'quota', type: 'rate_limit_exceeded' } });
		expect(output[0]).not.toHaveProperty('choices');
		OpenAIChatCompletionsStreamEventSchema.parse(output[0]);
	});

	it('reports and ignores a repeated upstream finish', () => {
		const ctx = makeCtx();
		const decoder = codec.createStreamDecoder(ctx);
		const finish = {
			id: 'c',
			object: 'chat.completion.chunk',
			created: 1,
			model: 'm',
			choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
		};
		expect(decoder.push(finish as never).filter((event) => event.type === 'finish')).toHaveLength(1);
		expect(decoder.push(finish as never)).toEqual([]);
		expect(codes(ctx.diagnostics)).toContain('lossy:stream.0.finish');
	});

	it('replays a stream future field as a native event on the same protocol', () => {
		const ctx = makeCtx();
		const input = {
			id: 'stream_future',
			object: 'provider.chat.chunk',
			created: 1700000000,
			model: 'gpt-chat',
			choices: [{ index: 0, delta: { content: 'hello' }, finish_reason: null }],
			future_chunk_field: { enabled: true },
		};
		const decoder = codec.createStreamDecoder(ctx);
		const events = decoder.push(input as never);
		expect(events).toEqual([{ type: 'native', api: API, value: input }]);
		const encoder = codec.createStreamEncoder(ctx);
		expect(encoder.push(events[0]!)).toStrictEqual([input]);
	});

	it('accepts only the first finish event for each choice', () => {
		const ctx = makeCtx();
		const encoder = codec.createStreamEncoder(ctx);
		const finish = { type: 'finish' as const, choice: 0, finishReason: 'stop' as const };
		expect(encoder.push(finish)).toHaveLength(1);
		expect(encoder.push(finish)).toEqual([]);
		expect(codes(ctx.diagnostics)).toContain('lossy:stream.0.finish');
	});

	it('encodes custom tool stream deltas as official function deltas with a drop diagnostic', () => {
		const ctx = makeCtx(ApiType.AnthropicMessages, API);
		const encoder = codec.createStreamEncoder(ctx);
		const events = [
			{
				type: 'part-start' as const,
				choice: 0,
				index: 0,
				role: 'assistant' as const,
				part: { type: 'tool-call' as const, id: 'c', name: 'regex', arguments: '', toolType: 'custom' as const },
			},
			{ type: 'part-delta' as const, choice: 0, index: 0, delta: { arguments: 'a+' } },
		];
		const output = events
			.flatMap((event) => encoder.push(event))
			.map((chunk) => OpenAIChatCompletionsChunkSchema.parse(chunk));
		for (const chunk of output) {
			for (const call of chunk.choices.flatMap((choice) => choice.delta.tool_calls ?? []))
				expect(call.type).toBe('function');
		}
		expect(output.flatMap((chunk) => chunk.choices).flatMap((choice) => choice.delta.tool_calls ?? [])).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ type: 'function', function: expect.objectContaining({ name: 'regex' }) }),
			]),
		);
		expect(codes(ctx.diagnostics)).toContain('drop:stream.0:0.toolType');
	});

	it('decodes and re-encodes realistic text, reasoning, tool and usage events', () => {
		const ctx = makeCtx();
		const decoder = codec.createStreamDecoder(ctx);
		const events = [...streamInput.flatMap((chunk) => decoder.push(structuredClone(chunk))), ...decoder.end()];
		expect(events.map((event) => event.type)).toContain('usage');
		expect(events.filter((event) => event.type === 'part-end').map((event) => event.part?.type)).toEqual([
			'reasoning',
			'text',
			'tool-call',
		]);
		const encoder = codec.createStreamEncoder(ctx);
		const output = [...events.flatMap((event) => encoder.push(event)), ...encoder.end()].map((chunk) =>
			OpenAIChatCompletionsChunkSchema.parse(chunk),
		);
		const text = output
			.flatMap((chunk) => chunk.choices)
			.map((choice) => choice.delta.content ?? '')
			.join('');
		expect(text).toBe('Hello world');
		const args = output
			.flatMap((chunk) => chunk.choices)
			.flatMap((choice) => choice.delta.tool_calls ?? [])
			.map((call) => call.function?.arguments ?? '')
			.join('');
		expect(args).toBe('{"city":"Paris"}');
		expect(
			output.every((chunk) => chunk.id === 'stream_1' && chunk.created === 1700000000 && chunk.model === 'gpt-chat'),
		).toBe(true);
	});
});

describe('OpenAIChatCompletionsCodec cross protocol and errors', () => {
	it('normalizes cross-protocol response content to the official string shape', () => {
		const ctx = makeCtx(ApiType.OpenAIResponses, API);
		const wire = codec.encodeResponse(
			{
				model: 'gpt-chat',
				choices: [
					{
						index: 0,
						message: {
							role: 'assistant',
							content: [
								{ type: 'text', text: 'hello' },
								{ type: 'image', url: 'https://example.test/image' },
							],
						},
					},
				],
			},
			ctx,
		);
		OpenAIChatCompletionsResponseSchema.parse(wire);
		expect(wire.choices[0]?.message.content).toBe('hello');
		expect(codes(ctx.diagnostics)).toContain('drop:choices[0].message.content[1]');
	});

	it('encodes other common parts and reports losses', () => {
		const ctx = makeCtx(ApiType.AnthropicMessages, API);
		const request: GenerateMessageRequest = {
			messages: [
				{ role: 'system', content: [{ type: 'text', text: 'system' }] },
				{
					role: 'assistant',
					content: [
						{ type: 'reasoning', text: 'think', signature: { api: ApiType.AnthropicMessages, value: 'sig' } },
						{ type: 'text', text: 'answer' },
					],
				},
				{
					role: 'tool',
					content: [
						{
							type: 'tool-result',
							toolCallId: 'c',
							content: [
								{ type: 'text', text: 'ok' },
								{ type: 'image', url: 'x' },
							],
						},
					],
				},
			],
			maxOutputTokens: 10,
		};
		const wire = codec.encodeRequest(request, ctx);
		OpenAIChatCompletionsRequestSchema.parse(wire);
		expect(wire.messages[0]).toMatchObject({ role: 'system' });
		expect(wire.messages[1]).toMatchObject({
			role: 'assistant',
			reasoning_details: [{ type: 'reasoning.text', text: 'think', format: 'anthropic-claude-v1', signature: 'sig' }],
		});
		expect(codes(ctx.diagnostics)).toContain('drop:messages[2].content[0].content[1]');
	});
	it('splits user tool results and preserves following user content order', () => {
		const ctx = makeCtx(ApiType.AnthropicMessages, API);
		const wire = codec.encodeRequest(
			{
				messages: [
					{
						role: 'user',
						content: [
							{ type: 'tool-result', toolCallId: 'a', content: 'A' },
							{ type: 'text', text: 'between' },
							{ type: 'tool-result', toolCallId: 'b', content: [{ type: 'text', text: 'B' }] },
							{ type: 'text', text: 'after' },
						],
					},
				],
			},
			ctx,
		);
		expect(wire.messages).toEqual([
			{ role: 'tool', tool_call_id: 'a', content: 'A' },
			{ role: 'user', content: [{ type: 'text', text: 'between' }] },
			{ role: 'tool', tool_call_id: 'b', content: [{ type: 'text', text: 'B' }] },
			{ role: 'user', content: [{ type: 'text', text: 'after' }] },
		]);
		OpenAIChatCompletionsRequestSchema.parse(wire);
	});
	it('maps error kinds and keeps native fields', () => {
		const ctx = makeCtx();
		const body = { error: { message: 'quota', type: 'insufficient_quota', param: 'x', code: 'billing', future: true } };
		const decoded = codec.decodeError({ status: 429, body: structuredClone(body) }, ctx);
		expect(decoded).toMatchObject({ kind: 'rate-limit', status: 429, code: 'billing', param: 'x' });
		expect(codec.encodeError(decoded, ctx)).toStrictEqual({ status: 429, body });
	});
});
