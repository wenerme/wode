import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import type { AiRouterFetch } from '../../src/ai/router';
import { ApiType } from '../../src/api/schema/ApiType';

export const protocols = [
	{ name: 'chat', api: ApiType.OpenAIChatCompletions },
	{ name: 'responses', api: ApiType.OpenAIResponses },
	{ name: 'anthropic', api: ApiType.AnthropicMessages },
	{ name: 'gemini', api: ApiType.GoogleGenerativeAI },
] as const;
export type Protocol = (typeof protocols)[number];
export type ProtocolName = Protocol['name'];
export type Wire = Record<string, unknown>;
export const alias = 'sdk-model-alias';
export const upstreamModel = 'fixture-upstream-model';
export const textParts = ['你好', '，世界'];
export const answer = textParts.join('');
export const toolName = 'get_weather';
export const toolInput = { city: '北京' };
export const toolOutput = { temperature: 23, condition: '晴' };
export const callId = 'call_weather_1';
export const errorMessage = 'fixture upstream capacity exhausted';
export const inputTokens = 11;
export const outputTokens = 7;

export function sdkModel(name: ProtocolName, fetch: AiRouterFetch, model = alias) {
	const common = { apiKey: 'client-secret-must-not-reach-upstream', fetch };
	switch (name) {
		case 'chat':
			return createOpenAI({ ...common, baseURL: 'https://router.test/v1' }).chat(model);
		case 'responses':
			return createOpenAI({ ...common, baseURL: 'https://router.test/v1' }).responses(model);
		case 'anthropic':
			return createAnthropic({ ...common, baseURL: 'https://router.test/v1' })(model);
		case 'gemini':
			return createGoogleGenerativeAI({ ...common, baseURL: 'https://router.test/v1beta' })(model);
	}
}

// Deliberately handwritten native wire. These fixtures never call the production
// codec: a symmetric encoder/decoder bug must not make the SDK matrix pass.
export function responseWire(name: ProtocolName, kind: 'text' | 'tool' = 'text'): Wire {
	const isTool = kind === 'tool';
	switch (name) {
		case 'chat':
			return {
				id: 'chatcmpl_fixture',
				object: 'chat.completion',
				created: 1_700_000_000,
				model: upstreamModel,
				choices: [
					{
						index: 0,
						finish_reason: isTool ? 'tool_calls' : 'stop',
						logprobs: null,
						message: {
							role: 'assistant',
							content: isTool ? null : answer,
							...(isTool
								? {
										tool_calls: [
											{
												id: callId,
												type: 'function',
												function: { name: toolName, arguments: JSON.stringify(toolInput) },
											},
										],
									}
								: {}),
						},
					},
				],
				usage: {
					prompt_tokens: inputTokens,
					completion_tokens: outputTokens,
					total_tokens: inputTokens + outputTokens,
				},
			};
		case 'responses':
			return {
				id: 'resp_fixture',
				object: 'response',
				created_at: 1_700_000_000,
				model: upstreamModel,
				status: 'completed',
				error: null,
				incomplete_details: null,
				instructions: null,
				metadata: {},
				parallel_tool_calls: true,
				temperature: 1,
				tool_choice: 'auto',
				tools: [],
				top_p: 1,
				output: [
					isTool
						? {
								id: 'fc_fixture',
								type: 'function_call',
								call_id: callId,
								name: toolName,
								arguments: JSON.stringify(toolInput),
								status: 'completed',
							}
						: {
								id: 'msg_fixture',
								type: 'message',
								role: 'assistant',
								status: 'completed',
								content: [{ type: 'output_text', text: answer, annotations: [], logprobs: [] }],
							},
				],
				usage: {
					input_tokens: inputTokens,
					output_tokens: outputTokens,
					total_tokens: inputTokens + outputTokens,
					input_tokens_details: { cached_tokens: 0 },
					output_tokens_details: { reasoning_tokens: 0 },
				},
			};
		case 'anthropic':
			return {
				id: 'msg_fixture',
				type: 'message',
				role: 'assistant',
				model: upstreamModel,
				content: [
					isTool ? { type: 'tool_use', id: callId, name: toolName, input: toolInput } : { type: 'text', text: answer },
				],
				stop_reason: isTool ? 'tool_use' : 'end_turn',
				stop_sequence: null,
				usage: { input_tokens: inputTokens, output_tokens: outputTokens },
			};
		case 'gemini':
			return {
				responseId: 'gemini_fixture',
				modelVersion: upstreamModel,
				candidates: [
					{
						index: 0,
						content: {
							role: 'model',
							parts: [isTool ? { functionCall: { id: callId, name: toolName, args: toolInput } } : { text: answer }],
						},
						finishReason: 'STOP',
					},
				],
				usageMetadata: {
					promptTokenCount: inputTokens,
					candidatesTokenCount: outputTokens,
					totalTokenCount: inputTokens + outputTokens,
				},
			};
	}
}

export function errorWire(name: ProtocolName, streaming = false): Wire {
	switch (name) {
		case 'chat':
			return { error: { message: errorMessage, type: 'rate_limit_error', code: 'rate_limit_exceeded', param: null } };
		case 'responses':
			return streaming
				? { type: 'error', sequence_number: 99, code: 'rate_limit_exceeded', message: errorMessage, param: null }
				: { error: { message: errorMessage, type: 'rate_limit_error', code: 'rate_limit_exceeded', param: null } };
		case 'anthropic':
			return { type: 'error', error: { type: 'rate_limit_error', message: errorMessage } };
		case 'gemini':
			return { error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: errorMessage } };
	}
}

export function sseFrame(name: ProtocolName, data: Wire | '[DONE]'): string {
	const event =
		typeof data === 'object' && (name === 'anthropic' || name === 'responses') ? `event: ${data.type}\n` : '';
	return `${event}data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`;
}

export type SseFixture = { prefix: string; suffix: string };

export function streamWire(name: ProtocolName, kind: 'text' | 'tool' | 'error' = 'text'): SseFixture {
	const tool = kind === 'tool';
	const final = responseWire(name, tool ? 'tool' : 'text');
	let prefix: Wire[] = [];
	let suffix: (Wire | '[DONE]')[] = [];
	switch (name) {
		case 'chat': {
			const chunk = (delta: Wire, finish: string | null = null): Wire => ({
				id: 'chatcmpl_fixture',
				object: 'chat.completion.chunk',
				created: 1_700_000_000,
				model: upstreamModel,
				choices: [{ index: 0, delta, finish_reason: finish, logprobs: null }],
			});
			prefix = [
				chunk({ role: 'assistant', content: '' }),
				chunk(
					tool
						? {
								tool_calls: [
									{ index: 0, id: callId, type: 'function', function: { name: toolName, arguments: '{"city":' } },
								],
							}
						: { content: textParts[0] },
				),
			];
			suffix = [
				chunk(tool ? { tool_calls: [{ index: 0, function: { arguments: '"北京"}' } }] } : { content: textParts[1] }),
				chunk({}, tool ? 'tool_calls' : 'stop'),
				{ ...chunk({}), choices: [], usage: final.usage },
				'[DONE]',
			];
			break;
		}
		case 'responses': {
			let sequence = 0;
			const event = (type: string, rest: Wire): Wire => ({ type, sequence_number: sequence++, ...rest });
			const item = (final.output as Wire[])[0];
			const empty = tool
				? { ...item, arguments: '', status: 'in_progress' }
				: { ...item, content: [], status: 'in_progress' };
			const position = { item_id: item.id, output_index: 0, content_index: 0 };
			prefix = [
				event('response.created', { response: { ...final, output: [], status: 'in_progress', usage: null } }),
				event('response.output_item.added', { output_index: 0, item: empty }),
			];
			if (tool) {
				prefix.push(event('response.function_call_arguments.delta', { ...position, delta: '{"city":' }));
				suffix.push(
					event('response.function_call_arguments.delta', { ...position, delta: '"北京"}' }),
					event('response.function_call_arguments.done', { ...position, arguments: JSON.stringify(toolInput) }),
				);
			} else {
				prefix.push(
					event('response.content_part.added', {
						...position,
						part: { type: 'output_text', text: '', annotations: [], logprobs: [] },
					}),
					event('response.output_text.delta', { ...position, delta: textParts[0], logprobs: [] }),
				);
				suffix.push(
					event('response.output_text.delta', { ...position, delta: textParts[1], logprobs: [] }),
					event('response.output_text.done', { ...position, text: answer, logprobs: [] }),
					event('response.content_part.done', { ...position, part: (item.content as Wire[])[0] }),
				);
			}
			suffix.push(
				event('response.output_item.done', { output_index: 0, item }),
				event('response.completed', { response: final }),
			);
			break;
		}
		case 'anthropic': {
			prefix = [
				{
					type: 'message_start',
					message: { ...final, content: [], stop_reason: null, usage: { input_tokens: inputTokens, output_tokens: 0 } },
				},
				{
					type: 'content_block_start',
					index: 0,
					content_block: tool
						? { type: 'tool_use', id: callId, name: toolName, input: {} }
						: { type: 'text', text: '' },
				},
				{
					type: 'content_block_delta',
					index: 0,
					delta: tool
						? { type: 'input_json_delta', partial_json: '{"city":' }
						: { type: 'text_delta', text: textParts[0] },
				},
			];
			suffix = [
				{
					type: 'content_block_delta',
					index: 0,
					delta: tool
						? { type: 'input_json_delta', partial_json: '"北京"}' }
						: { type: 'text_delta', text: textParts[1] },
				},
				{ type: 'content_block_stop', index: 0 },
				{
					type: 'message_delta',
					delta: { stop_reason: tool ? 'tool_use' : 'end_turn', stop_sequence: null },
					usage: { output_tokens: outputTokens },
				},
				{ type: 'message_stop' },
			];
			break;
		}
		case 'gemini': {
			const chunk = (part: Wire): Wire => ({
				responseId: 'gemini_fixture',
				modelVersion: upstreamModel,
				candidates: [{ index: 0, content: { role: 'model', parts: [part] } }],
			});
			prefix = [
				chunk(tool ? { functionCall: { id: callId, name: toolName, args: toolInput } } : { text: textParts[0] }),
			];
			suffix = [
				...(tool ? [] : [chunk({ text: textParts[1] })]),
				{
					responseId: 'gemini_fixture',
					candidates: [{ index: 0, finishReason: 'STOP' }],
					usageMetadata: final.usageMetadata,
				},
			];
			break;
		}
	}
	if (kind === 'error') suffix = [errorWire(name, true)];
	return {
		prefix: prefix.map((value) => sseFrame(name, value)).join(''),
		suffix: suffix.map((value) => sseFrame(name, value)).join(''),
	};
}

export function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

/** Split every UTF-8 codepoint and SSE boundary, and optionally hold the tail. */
export function chunkedSse(wire: SseFixture, gate?: Promise<void>): Response {
	const encoder = new TextEncoder();
	const segments = [encoder.encode(wire.prefix), encoder.encode(wire.suffix)];
	let segment = 0;
	let offset = 0;
	return new Response(
		new ReadableStream<Uint8Array>({
			async pull(controller) {
				if (offset === segments[segment].length) {
					segment++;
					offset = 0;
					if (segment === segments.length) {
						controller.close();
						return;
					}
					await gate;
				}
				controller.enqueue(segments[segment].slice(offset, ++offset));
			},
		}),
		{ headers: { 'content-type': 'text/event-stream; charset=utf-8' } },
	);
}
