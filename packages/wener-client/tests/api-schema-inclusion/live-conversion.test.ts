import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { z } from 'zod';
import {
	AnthropicMessagesResponseSchema,
	AnthropicMessagesStreamEventSchema,
	GeminiGenerateContentResponseSchema,
	OpenAIChatCompletionsChunkSchema,
	OpenAIChatCompletionsResponseSchema,
	OpenAIResponsesResponseSchema,
	OpenAIResponsesStreamEventSchema,
} from '../../src/api';
import {
	createGenerateMessageAdapter,
	defaultRequestProcessor,
	type GenerateMessageProcessor,
	type GenerateMessageRequest,
} from '../../src/api/generate-message/adapter';
import { ApiType } from '../../src/api/schema/ApiType';

const BASE_URL = process.env.TESTING_AI_BASE_URL?.replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 120_000;
const INVALID_MODEL = '__wener_live_conversion_model_that_does_not_exist__';

type JsonObject = Record<string, unknown>;
type Protocol = {
	name: string;
	api:
		| typeof ApiType.OpenAIChatCompletions
		| typeof ApiType.OpenAIResponses
		| typeof ApiType.AnthropicMessages
		| typeof ApiType.GoogleGenerativeAI;
	model: string;
	path: string;
	headers?: Record<string, string>;
	responseSchema: z.ZodType;
	streamSchema: z.ZodType;
};

const protocols: Protocol[] = [
	{
		name: 'chat',
		api: ApiType.OpenAIChatCompletions,
		model: process.env.TESTING_AI_MODEL_CHAT ?? 'qwen3.5-35b-a3b',
		path: '/v1/chat/completions',
		responseSchema: OpenAIChatCompletionsResponseSchema,
		streamSchema: OpenAIChatCompletionsChunkSchema,
	},
	{
		name: 'responses',
		api: ApiType.OpenAIResponses,
		model: process.env.TESTING_AI_MODEL_RESPONSES ?? 'gpt-6-sol',
		path: '/v1/responses',
		responseSchema: OpenAIResponsesResponseSchema,
		streamSchema: OpenAIResponsesStreamEventSchema,
	},
	{
		name: 'anthropic',
		api: ApiType.AnthropicMessages,
		model: process.env.TESTING_AI_MODEL_ANTHROPIC ?? 'claude-haiku-4-5',
		path: '/v1/messages',
		headers: { 'anthropic-version': '2023-06-01' },
		responseSchema: AnthropicMessagesResponseSchema,
		streamSchema: AnthropicMessagesStreamEventSchema,
	},
	{
		name: 'gemini',
		api: ApiType.GoogleGenerativeAI,
		model: process.env.TESTING_AI_MODEL_GEMINI ?? 'gemini-3.5-flash-lite',
		path: '',
		responseSchema: GeminiGenerateContentResponseSchema,
		streamSchema: GeminiGenerateContentResponseSchema,
	},
];

const toolParameters = {
	type: 'object',
	properties: { city: { type: 'string' } },
	required: ['city'],
	additionalProperties: false,
};

function adapterFor(source: Protocol, target: Protocol, model = target.model, stream = false) {
	const processors: GenerateMessageProcessor[] =
		target.api === ApiType.AnthropicMessages ? [defaultRequestProcessor({ maxOutputTokens: 256 })] : [];
	if (stream && source.api === ApiType.GoogleGenerativeAI) {
		processors.push({
			name: 'live-stream',
			onRequest: (request: GenerateMessageRequest) => ({ ...request, stream: true }),
		});
	}
	processors.push({
		name: 'live-diagnostics',
		onDiagnostic: (diagnostic) =>
			console.info(`[live diagnostics] ${source.name}->${target.name}`, JSON.stringify([diagnostic])),
	});
	return createGenerateMessageAdapter({
		source: source.api,
		target: target.api,
		model: source.api === ApiType.GoogleGenerativeAI ? model : undefined,
		processors,
	});
}

function textRequest(protocol: Protocol, model: string, stream = false): JsonObject {
	switch (protocol.api) {
		case ApiType.OpenAIChatCompletions:
			return {
				model,
				stream,
				max_completion_tokens: 256,
				messages: [
					{ role: 'system', content: 'Reply with exactly one lowercase word and no punctuation.' },
					{ role: 'user', content: 'Reply with the single word: pong' },
				],
			};
		case ApiType.OpenAIResponses:
			return {
				model,
				stream,
				max_output_tokens: 256,
				instructions: 'Reply with exactly one lowercase word and no punctuation.',
				input: 'Reply with the single word: pong',
			};
		case ApiType.AnthropicMessages:
			return {
				model,
				stream,
				max_tokens: 256,
				system: 'Reply with exactly one lowercase word and no punctuation.',
				messages: [{ role: 'user', content: 'Reply with the single word: pong' }],
			};
		case ApiType.GoogleGenerativeAI:
			return {
				contents: [{ role: 'user', parts: [{ text: 'Reply with the single word: pong' }] }],
				systemInstruction: {
					parts: [{ text: 'Reply with exactly one lowercase word and no punctuation.' }],
				},
				generationConfig: { maxOutputTokens: 256 },
			};
	}
}

function toolRequest(protocol: Protocol, model: string): JsonObject {
	switch (protocol.api) {
		case ApiType.OpenAIChatCompletions:
			return {
				model,
				max_completion_tokens: 256,
				messages: [
					{ role: 'system', content: 'You must call get_weather before answering.' },
					{ role: 'user', content: 'What is the weather in Beijing? Call get_weather with city Beijing.' },
				],
				tools: [
					{
						type: 'function',
						function: { name: 'get_weather', description: 'Get weather.', parameters: toolParameters },
					},
				],
				tool_choice: { type: 'function', function: { name: 'get_weather' } },
			};
		case ApiType.OpenAIResponses:
			return {
				model,
				max_output_tokens: 256,
				instructions: 'You must call get_weather before answering.',
				input: [
					{
						type: 'message',
						role: 'user',
						content: 'What is the weather in Beijing? Call get_weather with city Beijing.',
					},
				],
				tools: [{ type: 'function', name: 'get_weather', description: 'Get weather.', parameters: toolParameters }],
				tool_choice: { type: 'function', name: 'get_weather' },
			};
		case ApiType.AnthropicMessages:
			return {
				model,
				max_tokens: 256,
				system: 'You must call get_weather before answering.',
				messages: [{ role: 'user', content: 'What is the weather in Beijing? Call get_weather with city Beijing.' }],
				tools: [{ name: 'get_weather', description: 'Get weather.', input_schema: toolParameters }],
				tool_choice: { type: 'tool', name: 'get_weather' },
			};
		case ApiType.GoogleGenerativeAI:
			return {
				contents: [
					{ role: 'user', parts: [{ text: 'What is the weather in Beijing? Call get_weather with city Beijing.' }] },
				],
				systemInstruction: { parts: [{ text: 'You must call get_weather before answering.' }] },
				tools: [
					{ functionDeclarations: [{ name: 'get_weather', description: 'Get weather.', parameters: toolParameters }] },
				],
				toolConfig: { functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ['get_weather'] } },
				generationConfig: { maxOutputTokens: 256 },
			};
	}
}

function upstreamUrl(target: Protocol, path: string | undefined): string {
	assert(BASE_URL, 'TESTING_AI_BASE_URL is required');
	const endpoint = path ?? target.path;
	assert(endpoint.startsWith('/'), `转换: ${target.name} request has no upstream path`);
	return `${BASE_URL}${endpoint}`;
}

async function fetchUpstream(target: Protocol, path: string | undefined, body: unknown): Promise<Response> {
	return fetch(upstreamUrl(target, path), {
		method: 'POST',
		headers: { 'content-type': 'application/json', ...target.headers },
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	});
}

async function readBody(response: Response): Promise<unknown> {
	const text = await response.text();
	if (!text) return null;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

function preview(value: unknown): string {
	return (typeof value === 'string' ? value : JSON.stringify(value))?.slice(0, 500) ?? '';
}

function assertSourceErrorShape(source: Protocol, value: { status: number; body: unknown }): void {
	assert(Number.isInteger(value.status), `${source.name} error status is not an integer`);
	const body = Array.isArray(value.body) ? value.body[0] : value.body;
	assert(body && typeof body === 'object', `${source.name} error body is not an object`);
	const record = body as JsonObject;
	switch (source.api) {
		case ApiType.OpenAIChatCompletions:
		case ApiType.OpenAIResponses: {
			const error = record.error as JsonObject | undefined;
			assert(error && typeof error.message === 'string', `${source.name} error has no error.message`);
			return;
		}
		case ApiType.AnthropicMessages: {
			const error = record.error as JsonObject | undefined;
			assert(record.type === 'error', 'Anthropic error has no type=error');
			assert(
				error && typeof error.type === 'string' && typeof error.message === 'string',
				'Anthropic error is malformed',
			);
			return;
		}
		case ApiType.GoogleGenerativeAI: {
			const error = record.error as JsonObject | undefined;
			assert(
				error && Number.isInteger(error.code) && typeof error.message === 'string' && typeof error.status === 'string',
				'Gemini error is malformed',
			);
		}
	}
}

async function callJson(
	label: string,
	source: Protocol,
	target: Protocol,
	adapter: ReturnType<typeof adapterFor>,
	body: JsonObject,
): Promise<unknown> {
	const encoded = await adapter.request(body);
	const upstream = await fetchUpstream(target, encoded.path, encoded.body);
	const upstreamBody = await readBody(upstream);
	if (!upstream.ok) {
		const details = `${label}: 网关 HTTP ${upstream.status}: ${preview(upstreamBody)}`;
		console.info(details);
		try {
			const error = await adapter.error({ status: upstream.status, body: upstreamBody });
			assert.equal(error.status, upstream.status);
			assertSourceErrorShape(source, error);
		} catch (error) {
			throw new Error(`转换错误形态: ${String(error)}; ${details}`, { cause: error });
		}
		throw new Error(details);
	}
	adapter.context.state.set('live.upstream', upstreamBody);
	const response = await adapter.response(upstreamBody);
	const parsed = source.responseSchema.safeParse(response);
	if (!parsed.success) {
		throw new Error(`${label}: source response schema rejected: ${JSON.stringify(parsed.error.issues.slice(0, 5))}`);
	}
	return response;
}

async function callExpectedError(
	label: string,
	source: Protocol,
	target: Protocol,
	adapter: ReturnType<typeof adapterFor>,
	body: JsonObject,
): Promise<void> {
	const encoded = await adapter.request(body);
	const upstream = await fetchUpstream(target, encoded.path, encoded.body);
	const upstreamBody = await readBody(upstream);
	assert(!upstream.ok, `${label}: invalid model unexpectedly returned ${upstream.status}`);
	const error = await adapter.error({ status: upstream.status, body: upstreamBody });
	assertSourceErrorShape(source, error);
	if (adapter.context.diagnostics.length) console.info(`[live diagnostics] ${label}`, adapter.context.diagnostics);
	console.info(`[live upstream error] ${label} status=${upstream.status} body=${preview(upstreamBody)}`);
}

function responseText(protocol: Protocol, body: unknown): string {
	const record = body as JsonObject;
	switch (protocol.api) {
		case ApiType.OpenAIChatCompletions:
			return ((record.choices as JsonObject[] | undefined) ?? [])
				.map((choice) => {
					const message = choice.message as JsonObject;
					return typeof message?.content === 'string'
						? message.content
						: ((message?.content as JsonObject[] | undefined) ?? [])
								.map((part) => (typeof part.text === 'string' ? part.text : ''))
								.join('');
				})
				.join('');
		case ApiType.OpenAIResponses:
			return ((record.output as JsonObject[] | undefined) ?? [])
				.filter((item) => item.type === 'message')
				.flatMap((item) => (Array.isArray(item.content) ? (item.content as JsonObject[]) : []))
				.map((part) => (part.type === 'output_text' && typeof part.text === 'string' ? part.text : ''))
				.join('');
		case ApiType.AnthropicMessages:
			return ((record.content as JsonObject[] | undefined) ?? [])
				.map((part) => (typeof part.text === 'string' ? part.text : ''))
				.join('');
		case ApiType.GoogleGenerativeAI:
			return ((record.candidates as JsonObject[] | undefined) ?? [])
				.flatMap((candidate) => {
					const content = candidate.content as JsonObject | undefined;
					return Array.isArray(content?.parts) ? (content.parts as JsonObject[]) : [];
				})
				.filter((part) => part.thought !== true)
				.map((part) => (typeof part.text === 'string' ? part.text : ''))
				.join('');
	}
}

function toolCall(body: unknown): { id?: string; name: string; arguments: string } | undefined {
	const record = body as JsonObject;
	if (Array.isArray(record.choices)) {
		const message = (record.choices[0] as JsonObject | undefined)?.message as JsonObject | undefined;
		const call = (message?.tool_calls as JsonObject[] | undefined)?.[0];
		const fn = call?.function as JsonObject | undefined;
		if (typeof call?.id === 'string' && typeof fn?.name === 'string' && typeof fn.arguments === 'string')
			return { id: call.id, name: fn.name, arguments: fn.arguments };
	}
	if (Array.isArray(record.output)) {
		const call = (record.output as JsonObject[]).find((item) => item.type === 'function_call');
		if (call && typeof call.call_id === 'string' && typeof call.name === 'string' && typeof call.arguments === 'string')
			return { id: call.call_id, name: call.name, arguments: call.arguments };
	}
	if (Array.isArray(record.content)) {
		const call = (record.content as JsonObject[]).find((item) => item.type === 'tool_use');
		if (call && typeof call.id === 'string' && typeof call.name === 'string')
			return { id: call.id, name: call.name, arguments: JSON.stringify(call.input ?? {}) };
	}
	const candidate = (record.candidates as JsonObject[] | undefined)?.[0];
	const parts = ((candidate?.content as JsonObject | undefined)?.parts as JsonObject[] | undefined) ?? [];
	const call = parts.find((part) => part.functionCall || part.toolCall);
	const functionCall = (call?.functionCall ?? call?.toolCall) as JsonObject | undefined;
	if (functionCall && typeof functionCall.name === 'string') {
		return {
			id: typeof functionCall.id === 'string' ? functionCall.id : undefined,
			name: functionCall.name,
			arguments: JSON.stringify(functionCall.args ?? {}),
		};
	}
	return undefined;
}

function assertWeatherCall(
	protocol: Protocol,
	body: unknown,
): { id?: string; name: string; arguments: string } | undefined {
	const call = toolCall(body);
	if (!call) {
		console.warn(`[live model behavior] ${protocol.name}: response did not contain a tool call`, preview(body));
		return undefined;
	}
	if (call.name !== 'get_weather') {
		console.warn(`[live model behavior] ${protocol.name}: model called ${call.name} instead of get_weather`);
		return undefined;
	}
	let argumentsValue: JsonObject;
	try {
		argumentsValue = JSON.parse(call.arguments) as JsonObject;
	} catch {
		console.warn(`[live model behavior] ${protocol.name}: model returned invalid tool arguments`, call.arguments);
		return undefined;
	}
	if (!/Beijing|北京/i.test(String(argumentsValue.city))) {
		console.warn(`[live model behavior] ${protocol.name}: city argument was ${JSON.stringify(argumentsValue)}`);
		return undefined;
	}
	return call;
}

function continuationRequest(
	protocol: Protocol,
	original: JsonObject,
	response: JsonObject,
	call: { id?: string },
): JsonObject {
	switch (protocol.api) {
		case ApiType.OpenAIChatCompletions:
			return {
				...original,
				tool_choice: 'none',
				messages: [
					...((original.messages as JsonObject[]) ?? []),
					(response.choices as JsonObject[])[0]!.message,
					{ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ temp: 20 }) },
				],
			};
		case ApiType.OpenAIResponses:
			return {
				...original,
				tool_choice: 'none',
				input: [
					...((original.input as JsonObject[]) ?? []),
					...((response.output as JsonObject[]) ?? []),
					{ type: 'function_call_output', call_id: call.id, output: JSON.stringify({ temp: 20 }) },
				],
			};
		case ApiType.AnthropicMessages:
			return {
				...original,
				tool_choice: { type: 'none' },
				messages: [
					...((original.messages as JsonObject[]) ?? []),
					{ role: 'assistant', content: response.content },
					{
						role: 'user',
						content: [{ type: 'tool_result', tool_use_id: call.id, content: JSON.stringify({ temp: 20 }) }],
					},
				],
			};
		case ApiType.GoogleGenerativeAI: {
			const candidate = (response.candidates as JsonObject[])[0]!;
			return {
				...original,
				toolConfig: { functionCallingConfig: { mode: 'NONE' } },
				contents: [
					...((original.contents as JsonObject[]) ?? []),
					candidate.content,
					{ role: 'user', parts: [{ functionResponse: { name: 'get_weather', response: { temp: 20 }, id: call.id } }] },
				],
			};
		}
	}
}

function parseSse(input: string): unknown[] {
	const values: unknown[] = [];
	let data: string[] = [];
	const flush = () => {
		if (!data.length) return;
		const payload = data.join('\n');
		data = [];
		if (payload === '[DONE]') return;
		values.push(JSON.parse(payload));
	};
	for (const line of input.split(/\r?\n/)) {
		if (line === '') {
			flush();
			continue;
		}
		if (line.startsWith(':') || line.startsWith('event:')) continue;
		if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
	}
	flush();
	return values;
}

function streamText(events: unknown[]): string {
	const values: string[] = [];
	const visit = (value: unknown, key?: string) => {
		if (typeof value === 'string') {
			if (key === 'text' || key === 'content' || key === 'delta' || key === 'output_text') values.push(value);
			return;
		}
		if (Array.isArray(value)) {
			for (const item of value) visit(item);
			return;
		}
		if (value && typeof value === 'object') {
			for (const [childKey, child] of Object.entries(value)) visit(child, childKey);
		}
	};
	visit(events);
	return values.join('');
}

async function runStream(label: string, source: Protocol, target: Protocol): Promise<void> {
	const adapter = adapterFor(source, target, target.model, true);
	const encoded = await adapter.request(textRequest(source, target.model, true));
	const upstream = await fetchUpstream(target, encoded.path, encoded.body);
	const body = await upstream.text();
	if (!upstream.ok) {
		const upstreamBody = (() => {
			try {
				return JSON.parse(body);
			} catch {
				return body;
			}
		})();
		const error = await adapter.error({ status: upstream.status, body: upstreamBody });
		assertSourceErrorShape(source, error);
		throw new Error(`${label}: upstream ${upstream.status}: ${preview(upstreamBody)}`);
	}
	const stream = adapter.stream();
	const output: unknown[] = [];
	for (const event of parseSse(body)) {
		for (const converted of stream.push(event)) {
			source.streamSchema.parse(converted);
			output.push(converted);
		}
	}
	for (const converted of stream.end()) {
		source.streamSchema.parse(converted);
		output.push(converted);
	}
	assert(/pong/i.test(streamText(output)), `${label}: streamed text did not contain pong`);
	if (adapter.context.diagnostics.length) console.info(`[live diagnostics] ${label}`, adapter.context.diagnostics);
}

async function runText(source: Protocol, target: Protocol): Promise<void> {
	const adapter = adapterFor(source, target);
	const body = await callJson(
		`${source.name}->${target.name}:text`,
		source,
		target,
		adapter,
		textRequest(source, target.model),
	);
	assert(
		/pong/i.test(responseText(source, body)),
		`${source.name}->${target.name}: response text did not contain pong`,
	);
}

async function runTools(source: Protocol, target: Protocol): Promise<void> {
	const initial = toolRequest(source, target.model);
	const firstAdapter = adapterFor(source, target);
	const first = (await callJson(
		`${source.name}->${target.name}:tools`,
		source,
		target,
		firstAdapter,
		initial,
	)) as JsonObject;
	const call = assertWeatherCall(source, first);
	if (!call) return;
	const next = continuationRequest(source, initial, first, call);
	const secondAdapter = adapterFor(source, target);
	const second = await callJson(`${source.name}->${target.name}:tools-follow-up`, source, target, secondAdapter, next);
	assert(responseText(source, second).trim(), `${source.name}->${target.name}: tool follow-up returned no text`);
}

async function runError(source: Protocol, target: Protocol): Promise<void> {
	const body = textRequest(source, INVALID_MODEL);
	const adapter = adapterFor(source, target, INVALID_MODEL);
	await callExpectedError(`${source.name}->${target.name}:error`, source, target, adapter, body);
}

const describeSequential = (describe as typeof describe & { sequential?: typeof describe }).sequential ?? describe;

describe.skipIf(!BASE_URL)('GenerateMessage live gateway conversion', () => {
	describeSequential('16 protocol pairs', () => {
		for (const source of protocols) {
			for (const target of protocols) {
				const pair = `${source.name} -> ${target.name}`;
				test(`${pair} text`, () => runText(source, target), REQUEST_TIMEOUT_MS);
				test(`${pair} tools`, () => runTools(source, target), REQUEST_TIMEOUT_MS);
				test(`${pair} stream`, () => runStream(`${pair}:stream`, source, target), REQUEST_TIMEOUT_MS);
				test(`${pair} error`, () => runError(source, target), REQUEST_TIMEOUT_MS);
			}
		}
	});
});
