import { describe, expect, it } from 'vitest';
import {
	type AnthropicMessagesRequest,
	AnthropicMessagesRequestSchema,
	type AnthropicMessagesResponse,
	AnthropicMessagesResponseSchema,
	type AnthropicMessagesStreamEvent,
	AnthropicMessagesStreamEventSchema,
} from '../../../../anthropic-messages/schema';
import { ApiType } from '../../../../schema/ApiType';
import { createGenerateMessageAdapter } from '../../adapter';
import { createGenerateMessageAdapterContext } from '../../context';
import type {
	GenerateMessageDiagnostic,
	GenerateMessageRequest,
	GenerateMessageResponse,
	GenerateMessageStreamEvent,
} from '../../types';
import { AnthropicMessagesCodec as codec } from './codec';

const API = ApiType.AnthropicMessages;
const VERTEX = ApiType.GoogleVertexAnthropicMessages;

function makeCtx(source: ApiType = API, target: ApiType = API, model?: string) {
	let n = 0;
	return createGenerateMessageAdapterContext({
		source,
		target,
		model,
		generateId: (prefix) => `${prefix}_${++n}`,
		now: () => 1700000000,
	});
}

function codes(diagnostics: GenerateMessageDiagnostic[]) {
	return diagnostics.map((d) => `${d.code}:${d.path}`);
}

function roundTripRequest(wire: AnthropicMessagesRequest) {
	AnthropicMessagesRequestSchema.parse(wire);
	const input = structuredClone(wire);
	const ctx = makeCtx();
	const decoded = codec.decodeRequest(input, ctx);
	const encoded = codec.encodeRequest(decoded, ctx);
	expect(input).toStrictEqual(wire);
	expect(encoded).toStrictEqual(wire);
	expect(ctx.diagnostics).toEqual([]);
	return decoded;
}

it('preserves an unknown message role during same-protocol request round-trip', () => {
	const wire = {
		model: 'claude-compatible',
		max_tokens: 64,
		messages: [{ role: 'future-role', content: 'opaque', provider_field: { enabled: true } }],
	} as AnthropicMessagesRequest;
	expect(roundTripRequest(wire).messages[0]).toMatchObject({ role: 'future-role' });
});

function roundTripResponse(wire: AnthropicMessagesResponse) {
	AnthropicMessagesResponseSchema.parse(wire);
	const input = structuredClone(wire);
	const ctx = makeCtx();
	const decoded = codec.decodeResponse(input, ctx);
	const encoded = codec.encodeResponse(decoded, ctx);
	expect(input).toStrictEqual(wire);
	expect(encoded).toStrictEqual(wire);
	expect(ctx.diagnostics).toEqual([]);
	return decoded;
}

function encodeStream(events: GenerateMessageStreamEvent[], ctx = makeCtx()) {
	const encoder = codec.createStreamEncoder(ctx);
	const out = [...events.flatMap((e) => encoder.push(e)), ...encoder.end()];
	for (const event of out) AnthropicMessagesStreamEventSchema.parse(event);
	return out;
}

const requestSamples: Record<string, AnthropicMessagesRequest> = {
	'string system and string content': {
		model: 'claude-sonnet-4-5',
		max_tokens: 1024,
		system: 'You are helpful',
		messages: [
			{ role: 'user', content: 'Hello' },
			{ role: 'assistant', content: 'Hi' },
			{ role: 'user', content: 'How are you?' },
		],
		temperature: 0.5,
		stop_sequences: ['###'],
		metadata: { user_id: 'user-1' },
	},
	'system blocks with cache_control and tools with forced choice': {
		model: 'claude-sonnet-4-5',
		max_tokens: 2048,
		system: [
			{ type: 'text', text: 'You are a weather bot' },
			{ type: 'text', text: 'Long context', cache_control: { type: 'ephemeral' } },
		],
		messages: [{ role: 'user', content: [{ type: 'text', text: 'Weather in Paris?' }] }],
		tools: [
			{
				name: 'get_weather',
				description: 'Get weather',
				input_schema: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
				cache_control: { type: 'ephemeral' },
			},
			{
				type: 'custom',
				name: 'get_time',
				input_schema: { type: 'object', properties: {} },
				strict: true,
			},
		],
		tool_choice: { type: 'tool', name: 'get_weather', disable_parallel_tool_use: true },
	},
	'parallel tool calls and tool results': {
		model: 'claude-sonnet-4-5',
		max_tokens: 1024,
		messages: [
			{ role: 'user', content: 'Weather and time in Paris?' },
			{
				role: 'assistant',
				content: [
					{ type: 'text', text: 'Checking.' },
					{ type: 'tool_use', id: 'toolu_1', name: 'get_weather', input: { city: 'Paris', unit: 'c' } },
					{ type: 'tool_use', id: 'toolu_2', name: 'get_time', input: {} },
				],
			},
			{
				role: 'user',
				content: [
					{ type: 'tool_result', tool_use_id: 'toolu_1', content: '18C', cache_control: { type: 'ephemeral' } },
					{
						type: 'tool_result',
						tool_use_id: 'toolu_2',
						content: [{ type: 'text', text: 'failed' }],
						is_error: true,
					},
					{ type: 'tool_result', tool_use_id: 'toolu_3' },
					{ type: 'text', text: 'Summarize' },
				],
			},
		],
		tools: [{ name: 'get_weather', input_schema: { type: 'object' } }],
		tool_choice: { type: 'any' },
	},
	'multimodal blocks': {
		model: 'claude-sonnet-4-5',
		max_tokens: 1024,
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'image',
						source: { type: 'base64', media_type: 'image/png', data: 'iVBORw0K' },
						cache_control: { type: 'ephemeral' },
					},
					{ type: 'image', source: { type: 'url', url: 'https://example.com/a.jpg' } },
					{
						type: 'document',
						source: { type: 'base64', media_type: 'application/pdf', data: 'JVBERi0x' },
						title: 'report.pdf',
						citations: { enabled: true },
					},
					{ type: 'document', source: { type: 'file', file_id: 'file_011' } },
					{ type: 'document', source: { type: 'text', media_type: 'text/plain', data: 'plain text' } },
					{ type: 'text', text: 'Describe these' },
				],
			},
		],
	},
	'thinking with signatures and redacted thinking': {
		model: 'claude-sonnet-4-5',
		max_tokens: 4096,
		thinking: { type: 'enabled', budget_tokens: 2048 },
		messages: [
			{ role: 'user', content: 'Weather?' },
			{
				role: 'assistant',
				content: [
					{ type: 'thinking', thinking: 'Need the tool', signature: 'c2lnMQ==' },
					{ type: 'redacted_thinking', data: 'cmVkYWN0ZWQ=' },
					{ type: 'tool_use', id: 'toolu_1', name: 'get_weather', input: { city: 'Paris' } },
				],
			},
			{ role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_1', content: 'sunny' }] },
		],
		tools: [{ name: 'get_weather', input_schema: { type: 'object', properties: { city: { type: 'string' } } } }],
	},
	'unknown fields, blocks and server tools at every level': {
		model: 'claude-sonnet-4-5',
		max_tokens: 1024,
		service_tier: 'auto',
		output_config: { effort: 'high' },
		container: 'container_1',
		thinking: { type: 'adaptive' },
		messages: [
			{ role: 'user', content: 'Search the web', x_trace: 'a' },
			{
				role: 'assistant',
				content: [
					{ type: 'server_tool_use', id: 'srvtoolu_1', name: 'web_search', input: { query: 'claude' } },
					{
						type: 'web_search_tool_result',
						tool_use_id: 'srvtoolu_1',
						content: [{ type: 'web_search_result', url: 'https://example.com', title: 'Ex' }],
					},
					{
						type: 'text',
						text: 'Found it',
						citations: [{ type: 'web_search_result_location', url: 'https://example.com' }],
					},
				],
			},
		],
		tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
		tool_choice: { type: 'none' },
		metadata: { user_id: null, tenant: 't1' },
	},
	'thinking disabled and parallel flag on auto choice': {
		model: 'claude-haiku-4-5',
		max_tokens: 256,
		stream: true,
		top_p: 0.9,
		top_k: 40,
		thinking: { type: 'disabled' },
		messages: [{ role: 'user', content: [{ type: 'text', text: 'Hi', cache_control: { type: 'ephemeral' } }] }],
		tools: [{ name: 'noop', input_schema: { type: 'object' } }],
		tool_choice: { type: 'auto', disable_parallel_tool_use: false },
	},
	'inline system turn, unsigned thinking and empty input': {
		model: 'claude-sonnet-4-5',
		max_tokens: 512,
		thinking: { type: 'enabled', budget_tokens: 1024, display: 'summarized' },
		messages: [
			{ role: 'user', content: 'Start' },
			{
				role: 'assistant',
				content: [
					{ type: 'thinking', thinking: 'unsigned thought' },
					{ type: 'tool_use', id: 'toolu_9', name: 'ping', input: {} },
				],
			},
			{ role: 'system', content: 'Be terse from now on' },
			{ role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_9', content: '' }] },
		],
		metadata: {},
	},
};

const responseSamples: Record<string, AnthropicMessagesResponse> = {
	'plain text': {
		id: 'msg_1',
		type: 'message',
		role: 'assistant',
		content: [{ type: 'text', text: 'Hello!' }],
		model: 'claude-sonnet-4-5',
		stop_reason: 'end_turn',
		stop_sequence: null,
		usage: { input_tokens: 10, output_tokens: 3 },
	},
	'parallel tool use': {
		id: 'msg_2',
		type: 'message',
		role: 'assistant',
		content: [
			{ type: 'text', text: 'Checking both.' },
			{ type: 'tool_use', id: 'toolu_1', name: 'get_weather', input: { city: 'Paris', days: 2 } },
			{ type: 'tool_use', id: 'toolu_2', name: 'get_time', input: { tz: 'Europe/Paris' } },
		],
		model: 'claude-sonnet-4-5',
		stop_reason: 'tool_use',
		stop_sequence: null,
		usage: { input_tokens: 50, output_tokens: 40 },
	},
	'thinking, redacted thinking and text': {
		id: 'msg_3',
		type: 'message',
		role: 'assistant',
		content: [
			{ type: 'thinking', thinking: 'Let me think', signature: 'c2ln' },
			{ type: 'redacted_thinking', data: 'cmVk' },
			{ type: 'text', text: 'Answer' },
		],
		model: 'claude-sonnet-4-5',
		stop_reason: 'end_turn',
		stop_sequence: null,
		usage: { input_tokens: 20, output_tokens: 100, output_tokens_details: { thinking_tokens: 80 } },
	},
	'cache usage with nested details': {
		id: 'msg_4',
		type: 'message',
		role: 'assistant',
		content: [{ type: 'text', text: 'Cached' }],
		model: 'claude-sonnet-4-5',
		stop_reason: 'end_turn',
		stop_sequence: null,
		usage: {
			input_tokens: 5,
			output_tokens: 7,
			cache_read_input_tokens: 1000,
			cache_creation_input_tokens: 200,
			cache_creation: { ephemeral_5m_input_tokens: 200, ephemeral_1h_input_tokens: 0 },
			service_tier: 'standard',
			inference_geo: null,
		},
	},
	'stop sequence': {
		id: 'msg_5',
		type: 'message',
		role: 'assistant',
		content: [{ type: 'text', text: 'Partial' }],
		model: 'claude-sonnet-4-5',
		stop_reason: 'stop_sequence',
		stop_sequence: '###',
		usage: { input_tokens: 4, output_tokens: 2, cache_read_input_tokens: null, cache_creation_input_tokens: null },
	},
	'server tools, citations and container': {
		id: 'msg_6',
		type: 'message',
		role: 'assistant',
		container: { id: 'container_1', expires_at: '2025-01-01T00:00:00Z' },
		content: [
			{ type: 'server_tool_use', id: 'srvtoolu_1', name: 'web_search', input: { query: 'claude' } },
			{ type: 'web_search_tool_result', tool_use_id: 'srvtoolu_1', content: [] },
			{
				type: 'text',
				text: 'Found it',
				citations: [{ type: 'web_search_result_location', url: 'https://example.com', cited_text: 'x' }],
			},
		],
		model: 'claude-sonnet-4-5',
		stop_reason: 'end_turn',
		stop_sequence: null,
		usage: { input_tokens: 100, output_tokens: 30, server_tool_use: { web_search_requests: 1 } },
	},
	'max tokens': {
		id: 'msg_7',
		type: 'message',
		role: 'assistant',
		content: [{ type: 'text', text: 'Trunc' }],
		model: 'claude-sonnet-4-5',
		stop_reason: 'max_tokens',
		stop_sequence: null,
		usage: { input_tokens: 9, output_tokens: 1 },
	},
	'refusal with empty content': {
		id: 'msg_8',
		type: 'message',
		role: 'assistant',
		content: [],
		model: 'claude-sonnet-4-5',
		stop_reason: 'refusal',
		stop_details: { type: 'refusal', category: 'cyber' },
		stop_sequence: null,
		usage: { input_tokens: 9, output_tokens: 0 },
	},
	'unknown stop reason and null stop reason fields': {
		id: 'msg_9',
		type: 'message',
		role: 'assistant',
		content: [{ type: 'text', text: 'Paused' }],
		model: 'claude-sonnet-4-5',
		stop_reason: 'pause_turn',
		stop_sequence: null,
		usage: { input_tokens: 9, output_tokens: 1 },
	},
	'unknown response envelope type': {
		id: 'msg_future',
		type: 'provider.message',
		role: 'assistant',
		content: [{ type: 'text', text: 'Future envelope' }],
		model: 'claude-sonnet-4-5',
		stop_reason: 'end_turn',
		stop_sequence: null,
		usage: { input_tokens: 1, output_tokens: 1 },
	},
};

describe('AnthropicMessagesCodec request round trip', () => {
	for (const [name, wire] of Object.entries(requestSamples)) {
		it(name, () => {
			roundTripRequest(wire);
		});
	}

	it('maps fields to the common model', () => {
		const decoded = roundTripRequest(requestSamples['thinking with signatures and redacted thinking']!);
		expect(decoded.reasoning).toEqual({ enabled: true, budgetTokens: 2048 });
		expect(decoded.maxOutputTokens).toBe(4096);
		expect(decoded.messages[1]?.content).toMatchObject([
			{ type: 'reasoning', text: 'Need the tool', signature: { api: API, value: 'c2lnMQ==' } },
			{ type: 'reasoning', redacted: true, signature: { api: API, value: 'cmVkYWN0ZWQ=' } },
			{ type: 'tool-call', id: 'toolu_1', name: 'get_weather', arguments: '{"city":"Paris"}' },
		]);
		expect(decoded.messages[1]?.content[2]?.hints?.[API]).toEqual({ input: { city: 'Paris' } });
		expect(decoded.messages[2]?.content[0]).toMatchObject({
			type: 'tool-result',
			toolCallId: 'toolu_1',
			content: 'sunny',
		});

		const system = roundTripRequest(requestSamples['system blocks with cache_control and tools with forced choice']!);
		expect(system.system).toEqual([
			{ type: 'text', text: 'You are a weather bot' },
			{ type: 'text', text: 'Long context', extensions: { [API]: { cache_control: { type: 'ephemeral' } } } },
		]);
		expect(system.toolChoice).toEqual({ type: 'tool', name: 'get_weather' });
		expect(system.parallelToolCalls).toBe(false);

		const unknown = roundTripRequest(requestSamples['unknown fields, blocks and server tools at every level']!);
		expect(unknown.extensions?.[API]).toMatchObject({ service_tier: 'auto', thinking: { type: 'adaptive' } });
		expect(unknown.reasoning).toBeUndefined();
		expect(unknown.tools?.[0]).toMatchObject({ type: 'native', api: API });
		expect(unknown.messages[1]?.content.map((p) => p.type)).toEqual(['native', 'native', 'text']);
		expect(unknown.messages[0]?.extensions).toEqual({ [API]: { x_trace: 'a' } });

		const multimodal = roundTripRequest(requestSamples['multimodal blocks']!);
		expect(multimodal.messages[0]?.content.map((p) => p.type)).toEqual([
			'image',
			'image',
			'file',
			'file',
			'native',
			'text',
		]);
	});

	it('throws without max_tokens instead of injecting a default', () => {
		const ctx = makeCtx(ApiType.OpenAIChatCompletions, API);
		expect(() => codec.encodeRequest({ model: 'claude', messages: [{ role: 'user', content: [] }] }, ctx)).toThrow(
			/max_tokens/,
		);
	});

	it('works through the adapter', async () => {
		const adapter = createGenerateMessageAdapter({ source: API, target: API, getCodec: () => codec });
		const wire = requestSamples['parallel tool calls and tool results']!;
		const { body } = await adapter.request(structuredClone(wire));
		expect(body).toStrictEqual(wire);
		expect(adapter.context.diagnostics).toEqual([]);
	});

	it('treats Vertex Anthropic signatures and extensions as the same family', () => {
		const ctx = makeCtx(VERTEX, API);
		const encoded = codec.encodeRequest(
			{
				model: 'claude',
				maxOutputTokens: 100,
				messages: [
					{
						role: 'assistant',
						content: [
							{
								type: 'reasoning',
								text: 't',
								signature: { api: VERTEX, value: 'vsig' },
								extensions: { [VERTEX]: { cache_control: { type: 'ephemeral' } } },
							},
						],
					},
				],
			},
			ctx,
		);
		expect(encoded.messages[0]?.content).toEqual([
			{ type: 'thinking', thinking: 't', signature: 'vsig', cache_control: { type: 'ephemeral' } },
		]);
		expect(ctx.diagnostics).toEqual([]);
	});
});

describe('AnthropicMessagesCodec response round trip', () => {
	for (const [name, wire] of Object.entries(responseSamples)) {
		it(name, () => {
			roundTripResponse(wire);
		});
	}

	it('maps stop reasons and usage', () => {
		const cached = roundTripResponse(responseSamples['cache usage with nested details']!);
		expect(cached.usage).toMatchObject({
			inputTokens: 1205,
			outputTokens: 7,
			totalTokens: 1212,
			cachedInputTokens: 1000,
			cacheWriteInputTokens: 200,
		});
		const thinking = roundTripResponse(responseSamples['thinking, redacted thinking and text']!);
		expect(thinking.usage).toMatchObject({ inputTokens: 20, outputTokens: 100, reasoningTokens: 80 });
		expect(roundTripResponse(responseSamples['parallel tool use']!).choices[0]?.finishReason).toBe('tool-calls');
		expect(roundTripResponse(responseSamples['stop sequence']!).choices[0]?.finishReason).toBe('stop');
		expect(roundTripResponse(responseSamples['max tokens']!).choices[0]?.finishReason).toBe('length');
		expect(roundTripResponse(responseSamples['refusal with empty content']!).choices[0]?.finishReason).toBe(
			'content-filter',
		);
		expect(
			roundTripResponse(responseSamples['unknown stop reason and null stop reason fields']!).choices[0]?.finishReason,
		).toBe('other');
	});

	it('derives total usage without adding an Anthropic wire field', () => {
		const decoded = roundTripResponse(responseSamples['plain text']!);
		expect(decoded.usage).toEqual({ inputTokens: 10, outputTokens: 3, totalTokens: 13 });
	});
});

const streamEvents: AnthropicMessagesStreamEvent[] = [
	{
		type: 'message_start',
		message: {
			id: 'msg_s1',
			type: 'message',
			role: 'assistant',
			content: [],
			model: 'claude-sonnet-4-5',
			stop_reason: null,
			stop_sequence: null,
			usage: { input_tokens: 25, output_tokens: 1, cache_read_input_tokens: 0 },
		},
	},
	{ type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } },
	{ type: 'ping' },
	{ type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: 'Let me ' } },
	{ type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: 'think' } },
	{ type: 'content_block_delta', index: 0, delta: { type: 'signature_delta', signature: 'c2lnQQ==' } },
	{ type: 'content_block_stop', index: 0 },
	{ type: 'content_block_start', index: 1, content_block: { type: 'text', text: '' } },
	{ type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'Hello' } },
	{ type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: ' world' } },
	{ type: 'content_block_stop', index: 1 },
	{
		type: 'content_block_start',
		index: 2,
		content_block: { type: 'tool_use', id: 'toolu_1', name: 'get_weather', input: {} },
	},
	{ type: 'content_block_delta', index: 2, delta: { type: 'input_json_delta', partial_json: '' } },
	{ type: 'content_block_delta', index: 2, delta: { type: 'input_json_delta', partial_json: '{"city":' } },
	{ type: 'content_block_delta', index: 2, delta: { type: 'input_json_delta', partial_json: '"Paris"}' } },
	{ type: 'content_block_stop', index: 2 },
	{
		type: 'message_delta',
		delta: { stop_reason: 'tool_use', stop_sequence: null },
		usage: { output_tokens: 89 },
	},
	{ type: 'message_stop' },
];

describe('AnthropicMessagesCodec stream', () => {
	it.each([{ input_tokens: 10 }, { output_tokens: 3 }, {}])(
		'does not invent missing token counts for partial usage %j',
		(usage) => {
			const decoder = codec.createStreamDecoder(makeCtx(ApiType.OpenAIChatCompletions, API));
			const events = decoder.push({
				type: 'message_delta',
				delta: { stop_reason: 'end_turn', stop_sequence: null },
				usage,
			});
			const decoded = events.find((event) => event.type === 'usage');
			expect(decoded).toBeDefined();
			expect(decoded?.usage.totalTokens).toBeUndefined();
			expect(decoded?.usage.inputTokens).toBe(usage.input_tokens);
			expect(decoded?.usage.outputTokens).toBe(usage.output_tokens);
		},
	);

	it('decodes and re-encodes a realistic stream', () => {
		const ctx = makeCtx();
		const decoder = codec.createStreamDecoder(ctx);
		const events = [...streamEvents.flatMap((e) => decoder.push(structuredClone(e))), ...decoder.end()];
		expect(events.map((e) => e.type)).toEqual([
			'start',
			'usage',
			'part-start',
			'native',
			'part-delta',
			'part-delta',
			'part-delta',
			'part-end',
			'part-start',
			'part-delta',
			'part-delta',
			'part-end',
			'part-start',
			'part-delta',
			'part-delta',
			'part-delta',
			'part-end',
			'finish',
			'usage',
			'native',
		]);
		expect(events[0]).toMatchObject({ type: 'start', id: 'msg_s1', model: 'claude-sonnet-4-5' });
		expect(events[1]).toEqual({
			type: 'usage',
			usage: { inputTokens: 25, outputTokens: 1, totalTokens: 26, cachedInputTokens: 0 },
		});
		expect(events[3]).toEqual({ type: 'native', api: API, value: { type: 'ping' } });
		expect(events[7]).toMatchObject({
			type: 'part-end',
			part: { type: 'reasoning', text: 'Let me think', signature: { api: API, value: 'c2lnQQ==' } },
		});
		expect(events[11]).toMatchObject({ type: 'part-end', part: { type: 'text', text: 'Hello world' } });
		expect(events[16]).toMatchObject({
			type: 'part-end',
			part: { type: 'tool-call', id: 'toolu_1', name: 'get_weather', arguments: '{"city":"Paris"}' },
		});
		expect(events[17]).toMatchObject({ type: 'finish', choice: 0, finishReason: 'tool-calls' });

		const output = encodeStream(events, ctx);
		expect(output).toStrictEqual(streamEvents);
		expect(ctx.diagnostics).toEqual([]);
	});

	it.each([ApiType.OpenAIChatCompletions, ApiType.OpenAIResponses, ApiType.GoogleGenerativeAI])(
		'accumulates raw partial usage for %s without adding cache counts twice',
		(source) => {
			const decoder = codec.createStreamDecoder(makeCtx(source, API));
			const start: AnthropicMessagesStreamEvent = {
				type: 'message_start',
				message: {
					...responseSamples['plain text']!,
					content: [],
					stop_reason: null,
					usage: { input_tokens: 5, output_tokens: 1, cache_read_input_tokens: 100, cache_creation_input_tokens: 20 },
				},
			};
			const initial = decoder.push(start);
			expect(initial.at(-1)).toEqual({
				type: 'usage',
				usage: {
					inputTokens: 125,
					outputTokens: 1,
					totalTokens: 126,
					cachedInputTokens: 100,
					cacheWriteInputTokens: 20,
				},
			});
			const delta = (usage: Record<string, number>) =>
				decoder.push({ type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage });
			expect(delta({ output_tokens: 7 }).at(-1)).toEqual({
				type: 'usage',
				usage: {
					inputTokens: 125,
					outputTokens: 7,
					totalTokens: 132,
					cachedInputTokens: 100,
					cacheWriteInputTokens: 20,
				},
			});
			expect(delta({ input_tokens: 6, output_tokens: 9, cache_read_input_tokens: 110 }).at(-1)).toEqual({
				type: 'usage',
				usage: {
					inputTokens: 136,
					outputTokens: 9,
					totalTokens: 145,
					cachedInputTokens: 110,
					cacheWriteInputTokens: 20,
				},
			});
			expect(initial.at(-1)).toMatchObject({ usage: { inputTokens: 125, outputTokens: 1, totalTokens: 126 } });
			expect(start).toMatchObject({ message: { usage: { input_tokens: 5, output_tokens: 1 } } });
		},
	);

	it('keeps usage snapshots local to each stream decoder and leaves missing input unknown', () => {
		const ctx = makeCtx(ApiType.OpenAIChatCompletions, API);
		const first = codec.createStreamDecoder(ctx);
		first.push(streamEvents[0]!);
		const second = codec.createStreamDecoder(ctx);
		const delta: AnthropicMessagesStreamEvent = {
			type: 'message_delta',
			delta: { stop_reason: 'end_turn', stop_sequence: null },
			usage: { output_tokens: 7 },
		};
		expect(second.push(delta).at(-1)).toEqual({ type: 'usage', usage: { outputTokens: 7 } });
		expect(first.push(delta).at(-1)).toEqual({
			type: 'usage',
			usage: { inputTokens: 25, outputTokens: 7, totalTokens: 32, cachedInputTokens: 0 },
		});
	});

	it('round trips sparse delta usage exactly without carrying start cache fields onto the wire', () => {
		const wire: AnthropicMessagesStreamEvent[] = [
			{
				type: 'message_start',
				message: {
					...responseSamples['cache usage with nested details']!,
					content: [],
					stop_reason: null,
				},
			},
			{
				type: 'message_delta',
				delta: { stop_reason: 'end_turn', stop_sequence: null },
				usage: { output_tokens: 9, cache_read_input_tokens: null },
			},
			{ type: 'message_stop' },
		];
		const ctx = makeCtx();
		const decoder = codec.createStreamDecoder(ctx);
		const events = [...wire.flatMap((event) => decoder.push(structuredClone(event))), ...decoder.end()];
		expect(events.filter((event) => event.type === 'usage')[1]?.usage).toEqual({
			outputTokens: 9,
			hints: { [API]: { nulls: ['cache_read_input_tokens'] } },
		});
		expect(encodeStream(events, ctx)).toStrictEqual(wire);
		expect(ctx.diagnostics).toEqual([]);
	});

	it('replays server tool blocks, citation deltas and stop sequences', () => {
		const wire: AnthropicMessagesStreamEvent[] = [
			{
				type: 'message_start',
				message: {
					id: 'msg_s2',
					type: 'message',
					role: 'assistant',
					content: [],
					model: 'claude-sonnet-4-5',
					stop_reason: null,
					stop_sequence: null,
					usage: { input_tokens: 10, output_tokens: 1 },
				},
			},
			{
				type: 'content_block_start',
				index: 0,
				content_block: { type: 'server_tool_use', id: 'srvtoolu_1', name: 'web_search', input: {} },
			},
			{ type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"query":"x"}' } },
			{ type: 'content_block_stop', index: 0 },
			{
				type: 'content_block_start',
				index: 1,
				content_block: { type: 'web_search_tool_result', tool_use_id: 'srvtoolu_1', content: [] },
			},
			{ type: 'content_block_stop', index: 1 },
			{ type: 'content_block_start', index: 2, content_block: { type: 'text', text: '', citations: [] } },
			{
				type: 'content_block_delta',
				index: 2,
				delta: { type: 'citations_delta', citation: { type: 'web_search_result_location', url: 'u' } },
			},
			{ type: 'content_block_delta', index: 2, delta: { type: 'text_delta', text: 'Found' } },
			{ type: 'content_block_stop', index: 2 },
			{
				type: 'message_delta',
				delta: { stop_reason: 'stop_sequence', stop_sequence: '###' },
				usage: { output_tokens: 5, server_tool_use: { web_search_requests: 1 } },
			},
			{ type: 'message_stop' },
		];
		const ctx = makeCtx();
		const decoder = codec.createStreamDecoder(ctx);
		const events = [...wire.flatMap((e) => decoder.push(structuredClone(e))), ...decoder.end()];
		expect(events.find((e) => e.type === 'finish')).toMatchObject({ finishReason: 'stop' });
		expect(encodeStream(events, ctx)).toStrictEqual(wire);
		expect(ctx.diagnostics).toEqual([]);
	});

	it('round trips a stream error and stops afterwards', () => {
		const wire: AnthropicMessagesStreamEvent[] = [
			streamEvents[0]!,
			{ type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } },
		];
		const ctx = makeCtx();
		const decoder = codec.createStreamDecoder(ctx);
		const events = [...wire.flatMap((e) => decoder.push(structuredClone(e))), ...decoder.end()];
		expect(events.at(-1)).toMatchObject({ type: 'error', error: { kind: 'overloaded', code: 'overloaded_error' } });
		const encoder = codec.createStreamEncoder(ctx);
		const output = events.flatMap((e) => encoder.push(e));
		expect(output).toStrictEqual(wire);
		expect(encoder.push({ type: 'finish', choice: 0, finishReason: 'stop' })).toEqual([]);
		expect(encoder.end()).toEqual([]);

		const bare = codec.createStreamEncoder(makeCtx());
		expect(bare.push({ type: 'error', error: { kind: 'overloaded', message: 'busy' } })).toEqual([
			{ type: 'error', error: { type: 'overloaded_error', message: 'busy' } },
		]);
		expect(bare.end()).toEqual([]);
	});

	it('encodes events from another protocol', () => {
		const ctx = makeCtx(ApiType.OpenAIResponses, API);
		const events: GenerateMessageStreamEvent[] = [
			{ type: 'start', id: 'resp_1', model: 'claude-sonnet-4-5', created: 1700000000 },
			{
				type: 'part-start',
				choice: 0,
				index: 0,
				role: 'assistant',
				part: { type: 'reasoning', text: '', signature: { api: ApiType.OpenAIResponses, value: 'enc' } },
			},
			{ type: 'part-delta', choice: 0, index: 0, delta: { summary: 'plan' } },
			{ type: 'part-delta', choice: 0, index: 0, delta: { signature: 'more' } },
			{ type: 'part-end', choice: 0, index: 0 },
			{ type: 'native', api: ApiType.OpenAIResponses, value: { type: 'response.in_progress' } },
			{ type: 'part-start', choice: 0, index: 1, part: { type: 'text', text: 'Hel' } },
			{ type: 'part-delta', choice: 0, index: 1, delta: { text: 'lo' } },
			{
				type: 'part-start',
				choice: 0,
				index: 2,
				part: { type: 'tool-call', id: 'call_1', name: 'get_weather', arguments: '{"city":' },
			},
			{ type: 'part-delta', choice: 0, index: 2, delta: { arguments: '"Paris"}' } },
			{ type: 'part-start', choice: 1, index: 0, part: { type: 'text', text: 'other choice' } },
			{ type: 'finish', choice: 0, finishReason: 'tool-calls' },
			{ type: 'usage', usage: { inputTokens: 12, outputTokens: 30, cachedInputTokens: 2, totalTokens: 42 } },
		];
		const output = encodeStream(events, ctx);
		expect(output).toEqual([
			{
				type: 'message_start',
				message: {
					id: 'resp_1',
					type: 'message',
					role: 'assistant',
					content: [],
					model: 'claude-sonnet-4-5',
					stop_reason: null,
					stop_sequence: null,
					usage: { input_tokens: 0, output_tokens: 0 },
				},
			},
			{ type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '' } },
			{ type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: 'plan' } },
			{ type: 'content_block_stop', index: 0 },
			{ type: 'content_block_start', index: 1, content_block: { type: 'text', text: 'Hel' } },
			{ type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'lo' } },
			{ type: 'content_block_stop', index: 1 },
			{
				type: 'content_block_start',
				index: 2,
				content_block: { type: 'tool_use', id: 'call_1', name: 'get_weather', input: {} },
			},
			{ type: 'content_block_delta', index: 2, delta: { type: 'input_json_delta', partial_json: '{"city":' } },
			{ type: 'content_block_delta', index: 2, delta: { type: 'input_json_delta', partial_json: '"Paris"}' } },
			{ type: 'content_block_stop', index: 2 },
			{
				type: 'message_delta',
				delta: { stop_reason: 'tool_use', stop_sequence: null },
				usage: { input_tokens: 10, output_tokens: 30, cache_read_input_tokens: 2 },
			},
			{ type: 'message_stop' },
		]);
		expect(codes(ctx.diagnostics)).toEqual(['drop:choices[0].message.content[0].signature', 'drop:choices[1]']);
	});

	it('closes open blocks and finishes the message on end', () => {
		const ctx = makeCtx(ApiType.OpenAIChatCompletions, API, 'claude');
		const output = encodeStream(
			[
				{ type: 'part-delta', choice: 0, index: 0, delta: { text: 'Hi' } },
				{ type: 'native', api: ApiType.OpenAIChatCompletions, value: { object: 'chat.completion.chunk' } },
			],
			ctx,
		);
		expect(output.map((e) => e.type)).toEqual([
			'message_start',
			'content_block_start',
			'content_block_delta',
			'content_block_stop',
			'message_delta',
			'message_stop',
		]);
		expect(output[0]).toMatchObject({ message: { id: 'msg_1', model: 'claude' } });
		expect(output[4]).toEqual({
			type: 'message_delta',
			delta: { stop_reason: null, stop_sequence: null },
			usage: { output_tokens: 0 },
		});
		expect(ctx.diagnostics).toEqual([]);
	});
});

describe('AnthropicMessagesCodec cross-protocol encoding', () => {
	it('encodes a request from another protocol', () => {
		const ctx = makeCtx(ApiType.OpenAIChatCompletions, API);
		const request: GenerateMessageRequest = {
			model: 'claude-sonnet-4-5',
			maxOutputTokens: 1000,
			stream: true,
			seed: 7,
			reasoning: { effort: 'high' },
			extensions: { [ApiType.OpenAIChatCompletions]: { logprobs: true } },
			messages: [
				{ role: 'system', content: [{ type: 'text', text: 'You are helpful' }] },
				{
					role: 'user',
					content: [
						{ type: 'text', text: 'Look' },
						{ type: 'image', url: 'data:image/png;base64,AAAA', detail: 'high' },
						{ type: 'audio', data: 'UklG', format: 'wav' },
					],
				},
				{ role: 'developer', content: [{ type: 'text', text: 'Use tools' }] },
				{
					role: 'assistant',
					content: [
						{ type: 'reasoning', text: 'hidden', signature: { api: ApiType.OpenAIResponses, value: 'enc' } },
						{ type: 'refusal', text: 'Partly refused' },
						{
							type: 'tool-call',
							id: 'call_1',
							name: 'get_weather',
							arguments: '{"city":"Paris"}',
							signature: { api: ApiType.GoogleGenerativeAI, value: 'gsig' },
						},
						{ type: 'tool-call', id: 'call_2', name: 'get_time', arguments: '{}' },
					],
				},
				{ role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call_1', name: 'get_weather', content: '18C' }] },
				{
					role: 'tool',
					content: [
						{
							type: 'tool-result',
							toolCallId: 'call_2',
							content: [{ type: 'text', text: 'noon' }],
							isError: false,
						},
					],
				},
				{ role: 'user', content: [{ type: 'text', text: 'Thanks' }] },
			],
			tools: [
				{ type: 'function', name: 'get_weather', parameters: { type: 'object', properties: {} } },
				{ type: 'native', api: ApiType.OpenAIResponses, value: { type: 'web_search' } },
			],
			toolChoice: 'required',
			parallelToolCalls: false,
		};
		const encoded = codec.encodeRequest(request, ctx);
		AnthropicMessagesRequestSchema.parse(encoded);
		expect(encoded).toEqual({
			model: 'claude-sonnet-4-5',
			max_tokens: 1000,
			stream: true,
			system: [
				{ type: 'text', text: 'You are helpful' },
				{ type: 'text', text: 'Use tools' },
			],
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: 'Look' },
						{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } },
					],
				},
				{
					role: 'assistant',
					content: [
						{ type: 'text', text: 'Partly refused' },
						{ type: 'tool_use', id: 'call_1', name: 'get_weather', input: { city: 'Paris' } },
						{ type: 'tool_use', id: 'call_2', name: 'get_time', input: {} },
					],
				},
				{
					role: 'user',
					content: [
						{ type: 'tool_result', tool_use_id: 'call_1', content: '18C' },
						{ type: 'tool_result', tool_use_id: 'call_2', content: [{ type: 'text', text: 'noon' }], is_error: false },
						{ type: 'text', text: 'Thanks' },
					],
				},
			],
			tools: [{ name: 'get_weather', input_schema: { type: 'object', properties: {} } }],
			tool_choice: { type: 'any', disable_parallel_tool_use: true },
		});
		expect(codes(ctx.diagnostics)).toEqual([
			'drop:messages[1].content[1].detail',
			'drop:messages[1].content[2]',
			'reorder:messages[2]',
			'drop:messages[3].content[0]',
			'lossy:messages[3].content[1]',
			'drop:messages[3].content[2].signature',
			'drop:tools[1]',
			'lossy:reasoning',
			'drop:seed',
			'drop:logprobs',
		]);
	});

	it('encodes reasoning budgets and keeps family signatures', () => {
		const ctx = makeCtx(VERTEX, API);
		const encoded = codec.encodeRequest(
			{
				model: 'claude',
				maxOutputTokens: 4000,
				reasoning: { enabled: true, budgetTokens: 2000 },
				messages: [
					{
						role: 'assistant',
						content: [
							{ type: 'reasoning', text: 'x', signature: { api: API, value: 's' } },
							{ type: 'reasoning', redacted: true, signature: { api: VERTEX, value: 'r' } },
						],
					},
				],
			},
			ctx,
		);
		AnthropicMessagesRequestSchema.parse(encoded);
		expect(encoded.thinking).toEqual({ type: 'enabled', budget_tokens: 2000 });
		expect(encoded.messages[0]?.content).toEqual([
			{ type: 'thinking', thinking: 'x', signature: 's' },
			{ type: 'redacted_thinking', data: 'r' },
		]);
		expect(ctx.diagnostics).toEqual([]);
	});

	it('clamps sampling parameters to Anthropic ranges', () => {
		const ctx = makeCtx(ApiType.OpenAIResponses, API);
		const encoded = codec.encodeRequest(
			{ model: 'claude', maxOutputTokens: 100, temperature: 1.5, topP: -0.25, messages: [] },
			ctx,
		);
		AnthropicMessagesRequestSchema.parse(encoded);
		expect(encoded.temperature).toBe(1);
		expect(encoded.top_p).toBe(0);
		expect(ctx.diagnostics).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: 'lossy', path: 'temperature' }),
				expect.objectContaining({ code: 'lossy', path: 'topP' }),
			]),
		);
	});

	it('encodes a response from another protocol', () => {
		const ctx = makeCtx(API, ApiType.OpenAIChatCompletions);
		const response: GenerateMessageResponse = {
			id: 'chatcmpl_1',
			model: 'gpt-5',
			created: 1700000000,
			extensions: { [ApiType.OpenAIChatCompletions]: { system_fingerprint: 'fp' } },
			choices: [
				{
					index: 0,
					finishReason: 'tool-calls',
					message: {
						role: 'assistant',
						content: [
							{ type: 'reasoning', text: 'think', signature: { api: ApiType.OpenAIResponses, value: 'enc' } },
							{ type: 'refusal', text: 'no' },
							{ type: 'text', text: 'ok' },
							{ type: 'tool-call', id: 'call_1', name: 'f', arguments: 'not json' },
						],
					},
				},
				{ index: 1, message: { role: 'assistant', content: [{ type: 'text', text: 'alt' }] } },
			],
			usage: { inputTokens: 100, outputTokens: 20, cachedInputTokens: 40, totalTokens: 120 },
		};
		const encoded = codec.encodeResponse(response, ctx);
		AnthropicMessagesResponseSchema.parse(encoded);
		expect(encoded).toEqual({
			id: 'chatcmpl_1',
			type: 'message',
			role: 'assistant',
			content: [
				{ type: 'thinking', thinking: 'think' },
				{ type: 'text', text: 'no' },
				{ type: 'text', text: 'ok' },
				{ type: 'tool_use', id: 'call_1', name: 'f', input: {} },
			],
			model: 'gpt-5',
			stop_reason: 'tool_use',
			stop_sequence: null,
			usage: { input_tokens: 60, output_tokens: 20, cache_read_input_tokens: 40 },
		});
		expect(codes(ctx.diagnostics)).toEqual([
			'drop:choices[1]',
			'drop:choices[0].message.content[0].signature',
			'lossy:choices[0].message.content[1]',
			'lossy:choices[0].message.content[3].arguments',
			'drop:system_fingerprint',
		]);
	});

	it('fills required response fields with placeholders when the source has none', () => {
		const ctx = makeCtx(ApiType.OpenAIChatCompletions, API, 'claude');
		const encoded = codec.encodeResponse({ choices: [] }, ctx);
		AnthropicMessagesResponseSchema.parse(encoded);
		expect(encoded).toEqual({
			id: 'msg_1',
			type: 'message',
			role: 'assistant',
			content: [],
			model: 'claude',
			stop_reason: null,
			stop_sequence: null,
			usage: { input_tokens: 0, output_tokens: 0 },
		});
	});

	it('clamps negative cross-protocol usage fields before schema encoding', () => {
		const ctx = makeCtx(ApiType.GoogleGenerativeAI, API, 'claude');
		const encoded = codec.encodeResponse(
			{
				choices: [],
				usage: {
					inputTokens: 10,
					outputTokens: -3,
					reasoningTokens: -2,
					cachedInputTokens: -1,
				},
			},
			ctx,
		);
		AnthropicMessagesResponseSchema.parse(encoded);
		expect(encoded.usage).toEqual({
			input_tokens: 10,
			output_tokens: 0,
			cache_read_input_tokens: 0,
			output_tokens_details: { thinking_tokens: 0 },
		});
		expect(ctx.diagnostics).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: 'lossy', path: 'usage.outputTokens' }),
				expect.objectContaining({ code: 'lossy', path: 'usage.reasoningTokens' }),
				expect.objectContaining({ code: 'lossy', path: 'usage.cachedInputTokens' }),
			]),
		);
	});
});

describe('AnthropicMessagesCodec errors', () => {
	const cases: [number, string, string][] = [
		[400, 'invalid_request_error', 'invalid-request'],
		[401, 'authentication_error', 'authentication'],
		[403, 'permission_error', 'permission'],
		[404, 'not_found_error', 'not-found'],
		[413, 'request_too_large', 'context-length'],
		[429, 'rate_limit_error', 'rate-limit'],
		[500, 'api_error', 'server'],
		[529, 'overloaded_error', 'overloaded'],
	];
	for (const [status, type, kind] of cases) {
		it(`round trips ${type}`, () => {
			const body = { type: 'error', error: { type, message: 'boom' }, request_id: 'req_1' };
			const ctx = makeCtx();
			const error = codec.decodeError({ status, body: structuredClone(body) }, ctx);
			expect(error).toMatchObject({ kind, status, code: type, message: 'boom' });
			expect(codec.encodeError(error, ctx)).toStrictEqual({ status, body });
			expect(ctx.diagnostics).toEqual([]);
		});
	}

	it('detects prompt overflow in invalid_request_error', () => {
		const body = {
			type: 'error',
			error: { type: 'invalid_request_error', message: 'prompt is too long: 300000 tokens' },
		};
		const ctx = makeCtx();
		const error = codec.decodeError({ status: 400, body }, ctx);
		expect(error.kind).toBe('context-length');
		expect(codec.encodeError(error, ctx)).toStrictEqual({ status: 400, body });
	});

	it('maps kinds of other protocols to Anthropic types', () => {
		const ctx = makeCtx(ApiType.OpenAIChatCompletions, API);
		expect(codec.encodeError({ kind: 'overloaded', message: 'busy' }, ctx)).toEqual({
			status: 529,
			body: { type: 'error', error: { type: 'overloaded_error', message: 'busy' } },
		});
		expect(codec.encodeError({ kind: 'context-length', message: 'too long', status: 400 }, ctx)).toEqual({
			status: 400,
			body: { type: 'error', error: { type: 'invalid_request_error', message: 'too long' } },
		});
		expect(
			codec.encodeError({ kind: 'rate-limit', message: 'slow', code: 'rate_limit_exceeded', param: 'x' }, ctx),
		).toEqual({ status: 429, body: { type: 'error', error: { type: 'rate_limit_error', message: 'slow' } } });
		expect(codes(ctx.diagnostics)).toEqual(['drop:code', 'drop:param']);
	});

	it('decodes non-Anthropic error bodies by HTTP status and replays them', () => {
		const ctx = makeCtx();
		const error = codec.decodeError({ status: 502, body: 'Bad Gateway' }, ctx);
		expect(error).toMatchObject({ kind: 'server', status: 502, message: 'Bad Gateway' });
		expect(codec.encodeError(error, ctx)).toEqual({ status: 502, body: 'Bad Gateway' });
	});
});
