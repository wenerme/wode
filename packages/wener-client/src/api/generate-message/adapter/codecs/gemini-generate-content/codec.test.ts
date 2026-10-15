import { describe, expect, it } from 'vitest';
import {
	GeminiErrorResponseSchema,
	type GeminiGenerateContentRequest,
	GeminiGenerateContentRequestSchema,
	type GeminiGenerateContentResponse,
	GeminiGenerateContentResponseSchema,
} from '../../../../gemini-generate-content/schema';
import { ApiType } from '../../../../schema/ApiType';
import { createGenerateMessageAdapter } from '../../adapter';
import { createGenerateMessageAdapterContext } from '../../context';
import type {
	GenerateMessageDiagnostic,
	GenerateMessageRequest,
	GenerateMessageResponse,
	GenerateMessageStreamEvent,
} from '../../types';
import { GeminiGenerateContentCodec as codec } from './codec';

const API = ApiType.GoogleGenerativeAI;

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

function roundTripRequest(wire: GeminiGenerateContentRequest, model = 'gemini-2.5-pro') {
	const input = structuredClone(wire);
	const ctx = makeCtx(API, API, model);
	const decoded = codec.decodeRequest(input, ctx);
	const encoded = codec.encodeRequest(decoded, ctx);
	expect(input).toStrictEqual(wire);
	expect(encoded).toStrictEqual(wire);
	expect(ctx.diagnostics).toEqual([]);
	GeminiGenerateContentRequestSchema.parse(encoded);
	return decoded;
}

function roundTripResponse(wire: GeminiGenerateContentResponse) {
	const input = structuredClone(wire);
	const ctx = makeCtx();
	const decoded = codec.decodeResponse(input, ctx);
	const encoded = codec.encodeResponse(decoded, ctx);
	expect(input).toStrictEqual(wire);
	expect(encoded).toStrictEqual(wire);
	expect(ctx.diagnostics).toEqual([]);
	GeminiGenerateContentResponseSchema.parse(encoded);
	return decoded;
}

const requestSamples: Record<string, GeminiGenerateContentRequest> = {
	'plain text, omitted role and empty generation config': {
		contents: [{ parts: [{ text: 'Hello' }] }, { role: 'model', parts: [{ text: 'Hi' }] }],
		generationConfig: {},
	},
	'tool definitions grouped with native tools and forced tool choice': {
		contents: [{ role: 'user', parts: [{ text: 'Weather in Paris?' }] }],
		tools: [
			{
				functionDeclarations: [
					{
						name: 'get_weather',
						description: 'Get weather',
						parameters: { type: 'OBJECT', properties: { city: { type: 'STRING' } } },
					},
					{
						name: 'get_time',
						parametersJsonSchema: { type: 'object', properties: { tz: { type: 'string' } } },
						response: { type: 'OBJECT' },
					},
				],
				googleSearch: {},
			},
			{ codeExecution: {} },
			{ functionDeclarations: [{ name: 'noop' }] },
			{ urlContext: {}, futureTool: { enabled: true } },
		],
		toolConfig: {
			functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ['get_weather'] },
			retrievalConfig: { languageCode: 'en' },
		},
	},
	'parallel function calls and results without ids': {
		contents: [
			{ role: 'user', parts: [{ text: 'Paris and Tokyo' }] },
			{
				role: 'model',
				parts: [
					{ functionCall: { name: 'get_weather', args: { city: 'Paris' } }, thoughtSignature: 'c2lnLTE=' },
					{ functionCall: { name: 'get_weather', args: { city: 'Tokyo' } } },
					{ functionCall: { name: 'ping' } },
				],
			},
			{
				role: 'user',
				parts: [
					{ functionResponse: { name: 'get_weather', response: { temp: 20 } } },
					{ functionResponse: { name: 'get_weather', response: { temp: 25 } } },
					{ functionResponse: { name: 'ping', response: { output: 'pong' }, parts: [] } },
				],
			},
		],
		tools: [{ functionDeclarations: [{ name: 'get_weather' }, { name: 'ping' }] }],
	},
	'multimodal inline and file data': {
		contents: [
			{
				role: 'user',
				parts: [
					{ text: 'Describe these' },
					{ inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' }, mediaResolution: { level: 'HIGH' } },
					{ inlineData: { mimeType: 'audio/wav', data: 'UklGRg==' } },
					{ inlineData: { mimeType: 'application/pdf', data: 'JVBERi0=' } },
					{ fileData: { mimeType: 'image/jpeg', fileUri: 'gs://bucket/cat.jpg' } },
					{
						fileData: { mimeType: 'video/mp4', fileUri: 'https://example.com/v.mp4', displayName: 'v' },
						videoMetadata: { startOffset: '1s', endOffset: '5s' },
					},
					{ fileData: { fileUri: 'https://example.com/unknown' } },
					{ inlineData: { data: 'AAAA' } },
				],
			},
		],
	},
	'reasoning with signatures and thinking config': {
		contents: [
			{ role: 'user', parts: [{ text: 'Solve' }] },
			{
				role: 'model',
				parts: [
					{ text: 'Thinking...', thought: true, thoughtSignature: 'dGhvdWdodA==' },
					{ text: 'Answer', thoughtSignature: 'YW5zd2Vy' },
					{ thoughtSignature: 'b25seQ==' },
					{ text: 'Not a thought', thought: false },
				],
			},
		],
		generationConfig: {
			thinkingConfig: { thinkingBudget: -1, includeThoughts: true, thinkingLevel: 'high' },
		},
	},
	'unknown fields at every level and unknown parts': {
		contents: [
			{
				role: 'user',
				parts: [
					{ text: 'Run code', partMetadata: { k: 'v' }, futurePartField: 1 },
					{ executableCode: { language: 'PYTHON', code: 'print(1)' } },
					{ codeExecutionResult: { outcome: 'OUTCOME_OK', output: '1' } },
					{ brandNewPart: { x: 1 } },
				],
				contentExtra: true,
			},
			{ role: 'function', parts: [{ text: 'legacy role' }] },
		],
		safetySettings: [{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' }],
		cachedContent: 'cachedContents/abc',
		labels: { team: 'a' },
		futureTopLevel: { a: 1 },
	},
	'full generation config, json schema and system instruction': {
		systemInstruction: { role: 'system', parts: [{ text: 'Be terse' }, { text: 'Use JSON' }] },
		contents: [{ role: 'user', parts: [{ text: 'List' }] }],
		generationConfig: {
			temperature: 0.2,
			topP: 0.9,
			topK: 40,
			maxOutputTokens: 1024,
			stopSequences: ['END'],
			candidateCount: 2,
			seed: 7,
			presencePenalty: 0.1,
			frequencyPenalty: 0.3,
			responseMimeType: 'application/json',
			responseJsonSchema: { type: 'object' },
			responseSchema: { type: 'OBJECT' },
			responseModalities: ['TEXT'],
			futureConfig: 'x',
		},
	},
	'calling modes, ids and model in body': {
		model: 'models/gemini-2.5-flash',
		contents: [
			{ role: 'model', parts: [{ functionCall: { id: 'fc-1', name: 'a', args: { n: 1 } } }] },
			{ role: 'user', parts: [{ functionResponse: { id: 'fc-1', name: 'a', response: { ok: true } } }] },
		],
		toolConfig: {
			functionCallingConfig: { mode: 'VALIDATED', allowedFunctionNames: ['a'] },
		},
		generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'ARRAY' } },
	},
	'ANY with several names, AUTO, zero budget and text mime': {
		contents: [{ role: 'user', parts: [{ text: 'x' }] }],
		toolConfig: {
			functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ['a', 'b'], streamFunctionCallArguments: true },
		},
		generationConfig: { responseMimeType: 'text/plain', thinkingConfig: { thinkingBudget: 0 } },
		systemInstruction: { parts: [] },
	},
	'AUTO and empty tool config': {
		contents: [],
		toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
		systemInstruction: {},
	},
};

const responseSamples: Record<string, GeminiGenerateContentResponse> = {
	'simple text with usage': {
		candidates: [
			{
				content: { role: 'model', parts: [{ text: 'Hello there' }] },
				finishReason: 'STOP',
				index: 0,
				safetyRatings: [{ category: 'HARM_CATEGORY_HARASSMENT', probability: 'NEGLIGIBLE' }],
			},
		],
		usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3, totalTokenCount: 8 },
		modelVersion: 'gemini-2.5-flash',
		responseId: 'resp-1',
	},
	'parallel function calls': {
		candidates: [
			{
				content: {
					role: 'model',
					parts: [
						{ functionCall: { id: 'a1', name: 'get_weather', args: { city: 'Paris' } }, thoughtSignature: 'c2ln' },
						{ functionCall: { id: 'a2', name: 'get_weather', args: { city: 'Tokyo' } } },
					],
				},
				finishReason: 'STOP',
				index: 0,
			},
		],
	},
	'multiple candidates without index': {
		candidates: [
			{ content: { role: 'model', parts: [{ text: 'A' }] }, finishReason: 'STOP', citationMetadata: { citations: [] } },
			{ content: { role: 'model', parts: [{ text: 'B' }] }, finishReason: 'MAX_TOKENS' },
		],
	},
	'thinking with detailed usage': {
		candidates: [
			{
				content: {
					role: 'model',
					parts: [
						{ text: 'Reasoning', thought: true },
						{ text: 'Done', thoughtSignature: 'ZG9uZQ==' },
					],
				},
				finishReason: 'STOP',
				index: 0,
			},
		],
		usageMetadata: {
			promptTokenCount: 100,
			candidatesTokenCount: 20,
			thoughtsTokenCount: 50,
			totalTokenCount: 170,
			cachedContentTokenCount: 40,
			toolUsePromptTokenCount: 3,
			promptTokensDetails: [{ modality: 'TEXT', tokenCount: 100 }],
			trafficType: 'ON_DEMAND',
		},
	},
	'blocked prompt without candidates': {
		promptFeedback: { blockReason: 'SAFETY', safetyRatings: [{ category: 'X', probability: 'HIGH' }] },
		usageMetadata: { promptTokenCount: 4, totalTokenCount: 4 },
	},
	'filtered candidates and unknown finish reasons': {
		candidates: [
			{ finishReason: 'SAFETY', index: 0 },
			{ content: { role: 'model', parts: [] }, finishReason: 'IMAGE_SAFETY', index: 1 },
			{ content: { role: 'model', parts: [{ text: 'x' }] }, finishReason: 'OTHER', index: 2 },
			{ content: { parts: [{ text: 'no role' }] }, finishReason: 'SPII', index: 3 },
		],
	},
	'code execution and image output': {
		candidates: [
			{
				content: {
					role: 'model',
					parts: [
						{ executableCode: { language: 'PYTHON', code: 'print(2)' } },
						{ codeExecutionResult: { outcome: 'OUTCOME_OK', output: '2' } },
						{ inlineData: { mimeType: 'image/png', data: 'iVBO' }, thoughtSignature: 'aW1n' },
					],
				},
				finishReason: 'STOP',
				index: 0,
				groundingMetadata: { webSearchQueries: ['q'] },
			},
		],
		createTime: '2025-01-01T00:00:00Z',
		modelStatus: { modelStage: 'STABLE' },
	},
	'malformed call and thoughts-only usage': {
		candidates: [{ finishReason: 'MALFORMED_FUNCTION_CALL', finishMessage: 'bad json', index: 0 }],
		usageMetadata: { promptTokenCount: 7, thoughtsTokenCount: 9, totalTokenCount: 16 },
		unknownTop: 1,
	},
};

describe('GeminiGenerateContentCodec request round trip', () => {
	for (const [name, wire] of Object.entries(requestSamples)) {
		it(name, () => {
			roundTripRequest(wire);
		});
	}

	it('maps fields to the common model', () => {
		const tools = roundTripRequest(
			requestSamples['tool definitions grouped with native tools and forced tool choice']!,
		);
		expect(tools.model).toBe('gemini-2.5-pro');
		expect(tools.toolChoice).toEqual({ type: 'tool', name: 'get_weather' });
		expect(tools.tools?.map((t) => t.type)).toEqual(['function', 'function', 'native', 'native', 'function', 'native']);

		const calls = roundTripRequest(requestSamples['parallel function calls and results without ids']!);
		const [, assistant, results] = calls.messages;
		expect(assistant?.role).toBe('assistant');
		expect(assistant?.content[0]).toMatchObject({
			type: 'tool-call',
			id: 'call_1',
			arguments: '{"city":"Paris"}',
			signature: { api: API, value: 'c2lnLTE=' },
		});
		expect(results?.role).toBe('user');
		expect(results?.content.map((p) => p.type === 'tool-result' && p.toolCallId)).toEqual([
			'call_1',
			'call_2',
			'call_3',
		]);

		const config = roundTripRequest(requestSamples['full generation config, json schema and system instruction']!);
		expect(config.system).toEqual([
			{ type: 'text', text: 'Be terse' },
			{ type: 'text', text: 'Use JSON' },
		]);
		expect(config).toMatchObject({
			temperature: 0.2,
			n: 2,
			stop: ['END'],
			responseFormat: { type: 'json_schema', schema: { type: 'object' } },
		});

		const reasoning = roundTripRequest(requestSamples['reasoning with signatures and thinking config']!);
		expect(reasoning.reasoning).toMatchObject({ enabled: true, effort: 'high' });
		expect(reasoning.messages[1]?.content.map((p) => p.type)).toEqual(['reasoning', 'text', 'reasoning', 'text']);

		const media = roundTripRequest(requestSamples['multimodal inline and file data']!);
		expect(media.messages[0]?.content.map((p) => p.type)).toEqual([
			'text',
			'image',
			'audio',
			'file',
			'image',
			'file',
			'file',
			'file',
		]);
	});

	it('uses the path model over the body model and keeps the body model', () => {
		const wire = { model: 'body-model', contents: [] };
		const ctx = makeCtx(API, API, 'path-model');
		const decoded = codec.decodeRequest(wire, ctx);
		expect(decoded.model).toBe('path-model');
		expect(codec.encodeRequest(decoded, ctx)).toStrictEqual(wire);
	});

	it('builds the request path', () => {
		const ctx = makeCtx(API, API, 'gemini-2.5-pro');
		expect(codec.requestPath?.({ messages: [] }, ctx)).toBe('/v1beta/models/gemini-2.5-pro:generateContent');
		expect(codec.requestPath?.({ model: 'a/b', messages: [], stream: true }, makeCtx())).toBe(
			'/v1beta/models/a%2Fb:streamGenerateContent?alt=sse',
		);
		expect(() => codec.requestPath?.({ messages: [] }, makeCtx())).toThrow(/model/);
	});

	it('works through the adapter', async () => {
		const adapter = createGenerateMessageAdapter({
			source: API,
			target: ApiType.GoogleVertex,
			model: 'gemini-2.5-pro',
			getCodec: () => codec,
		});
		const wire = requestSamples['reasoning with signatures and thinking config']!;
		const { body, path } = await adapter.request(structuredClone(wire));
		expect(body).toStrictEqual(wire);
		expect(path).toBe('/v1beta/models/gemini-2.5-pro:generateContent');
		expect(adapter.context.diagnostics).toEqual([]);
	});
});

describe('GeminiGenerateContentCodec response round trip', () => {
	for (const [name, wire] of Object.entries(responseSamples)) {
		it(name, () => {
			roundTripResponse(wire);
		});
	}

	it('maps finish reasons, usage and choices', () => {
		const calls = roundTripResponse(responseSamples['parallel function calls']!);
		expect(calls.choices[0]?.finishReason).toBe('tool-calls');

		const thinking = roundTripResponse(responseSamples['thinking with detailed usage']!);
		expect(thinking.usage).toMatchObject({
			inputTokens: 100,
			outputTokens: 70,
			reasoningTokens: 50,
			cachedInputTokens: 40,
			totalTokens: 170,
		});

		const multi = roundTripResponse(responseSamples['multiple candidates without index']!);
		expect(multi.choices.map((c) => [c.index, c.finishReason])).toEqual([
			[0, 'stop'],
			[1, 'length'],
		]);

		const filtered = roundTripResponse(responseSamples['filtered candidates and unknown finish reasons']!);
		expect(filtered.choices.map((c) => c.finishReason)).toEqual(['content-filter', 'other', 'other', 'content-filter']);

		const malformed = roundTripResponse(responseSamples['malformed call and thoughts-only usage']!);
		expect(malformed.choices[0]?.finishReason).toBe('error');
		expect(malformed.usage?.outputTokens).toBe(9);

		const simple = roundTripResponse(responseSamples['simple text with usage']!);
		expect(simple).toMatchObject({ id: 'resp-1', model: 'gemini-2.5-flash' });
	});
});

interface Accumulated {
	text: string;
	thought: string;
	signatures: string[];
	calls: unknown[];
	finishReason?: string;
}

function accumulate(chunks: GeminiGenerateContentResponse[]) {
	const candidates = new Map<number, Accumulated>();
	let usage: unknown;
	for (const chunk of chunks) {
		GeminiGenerateContentResponseSchema.parse(chunk);
		if (chunk.usageMetadata) usage = chunk.usageMetadata;
		chunk.candidates?.forEach((candidate, i) => {
			const index = candidate.index ?? i;
			const acc = candidates.get(index) ?? { text: '', thought: '', signatures: [], calls: [] };
			candidates.set(index, acc);
			for (const part of candidate.content?.parts ?? []) {
				if (part.thoughtSignature) acc.signatures.push(part.thoughtSignature);
				if (part.functionCall) acc.calls.push(part.functionCall);
				else if (part.thought) acc.thought += part.text ?? '';
				else if (part.text) acc.text += part.text;
			}
			if (candidate.finishReason) acc.finishReason = candidate.finishReason;
		});
	}
	return { candidates: Object.fromEntries(candidates), usage };
}

const streamChunks: GeminiGenerateContentResponse[] = [
	{
		candidates: [{ content: { role: 'model', parts: [{ text: 'Let me', thought: true }] }, index: 0 }],
		usageMetadata: { promptTokenCount: 10, totalTokenCount: 10 },
		modelVersion: 'gemini-2.5-pro',
		responseId: 'r-1',
	},
	{
		candidates: [
			{
				content: { role: 'model', parts: [{ text: ' think', thought: true, thoughtSignature: 'dGhpbms=' }] },
				index: 0,
			},
		],
		modelVersion: 'gemini-2.5-pro',
		responseId: 'r-1',
	},
	{
		candidates: [{ content: { role: 'model', parts: [{ text: 'Hello', thoughtSignature: 'c2lnQQ==' }] }, index: 0 }],
		modelVersion: 'gemini-2.5-pro',
		responseId: 'r-1',
	},
	{
		candidates: [{ content: { role: 'model', parts: [{ text: ' world' }] }, index: 0 }],
		modelVersion: 'gemini-2.5-pro',
		responseId: 'r-1',
	},
	{
		candidates: [
			{
				content: {
					role: 'model',
					parts: [
						{ functionCall: { name: 'get_weather', args: { city: 'Paris' } }, thoughtSignature: 'c2lnQg==' },
						{ functionCall: { name: 'get_time', args: {} } },
					],
				},
				finishReason: 'STOP',
				index: 0,
			},
		],
		usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 8, thoughtsTokenCount: 4, totalTokenCount: 22 },
		modelVersion: 'gemini-2.5-pro',
		responseId: 'r-1',
	},
];

describe('GeminiGenerateContentCodec stream', () => {
	it('reports and ignores a repeated upstream candidate finish', () => {
		const ctx = makeCtx();
		const decoder = codec.createStreamDecoder(ctx);
		const finish = { candidates: [{ index: 0, finishReason: 'STOP' }] };
		expect(decoder.push(finish as never).filter((event) => event.type === 'finish')).toHaveLength(1);
		expect(decoder.push(finish as never)).toEqual([]);
		expect(codes(ctx.diagnostics)).toContain('lossy:stream.0.finish');
	});

	it('replays a stream future field as a native event on the same protocol', () => {
		const ctx = makeCtx();
		const input = {
			candidates: [{ content: { role: 'model', parts: [{ text: 'hello' }] }, index: 0 }],
			futureChunkField: { enabled: true },
		};
		const decoder = codec.createStreamDecoder(ctx);
		const events = decoder.push(input as never);
		expect(events).toEqual([{ type: 'native', api: API, value: input }]);
		const encoder = codec.createStreamEncoder(ctx);
		expect(encoder.push(events[0]!)).toStrictEqual([input]);
	});

	it('decodes and re-encodes a realistic stream', () => {
		const ctx = makeCtx();
		const decoder = codec.createStreamDecoder(ctx);
		const events = [...streamChunks.flatMap((chunk) => decoder.push(structuredClone(chunk))), ...decoder.end()];
		expect(events.map((e) => e.type)).toEqual([
			'start',
			'part-start',
			'part-delta',
			'part-delta',
			'part-delta',
			'part-end',
			'part-start',
			'part-delta',
			'part-delta',
			'part-delta',
			'part-end',
			'part-start',
			'part-delta',
			'part-end',
			'part-start',
			'part-delta',
			'part-end',
			'finish',
			'usage',
		]);
		expect(events[0]).toEqual({ type: 'start', id: 'r-1', model: 'gemini-2.5-pro' });
		expect(events[5]).toEqual({
			type: 'part-end',
			choice: 0,
			index: 0,
			part: { type: 'reasoning', text: 'Let me think', signature: { api: API, value: 'dGhpbms=' } },
		});
		expect(events[10]).toEqual({
			type: 'part-end',
			choice: 0,
			index: 1,
			part: { type: 'text', text: 'Hello world', signature: { api: API, value: 'c2lnQQ==' } },
		});
		expect(events.find((e) => e.type === 'finish')).toMatchObject({ finishReason: 'tool-calls' });
		expect(events.at(-1)).toEqual({
			type: 'usage',
			usage: { inputTokens: 10, outputTokens: 12, reasoningTokens: 4, totalTokens: 22 },
		});

		const encoder = codec.createStreamEncoder(ctx);
		const output = [...events.flatMap((e) => encoder.push(e)), ...encoder.end()];
		expect(accumulate(output)).toEqual(accumulate(streamChunks));
		expect(output.every((chunk) => chunk.responseId === 'r-1' && chunk.modelVersion === 'gemini-2.5-pro')).toBe(true);
		// The signature stays on the first text chunk and the generated call id is not emitted.
		expect(
			output.find((c) => c.candidates?.[0]?.content?.parts?.[0]?.text === 'Hello')?.candidates?.[0]?.content
				?.parts?.[0],
		).toEqual({
			text: 'Hello',
			thoughtSignature: 'c2lnQQ==',
		});
		expect(accumulate(output).candidates[0]?.calls).toEqual([
			{ name: 'get_weather', args: { city: 'Paris' } },
			{ name: 'get_time', args: {} },
		]);
		expect(ctx.diagnostics).toEqual([]);
	});

	it('encodes events from another protocol', () => {
		const ctx = makeCtx(API, ApiType.AnthropicMessages);
		const encoder = codec.createStreamEncoder(ctx);
		const events: GenerateMessageStreamEvent[] = [
			{ type: 'start', id: 'msg_1', model: 'claude', created: 1700000000 },
			{ type: 'part-start', choice: 0, index: 0, role: 'assistant', part: { type: 'reasoning', text: '' } },
			{ type: 'part-delta', choice: 0, index: 0, delta: { text: 'hmm' } },
			{ type: 'part-delta', choice: 0, index: 0, delta: { signature: 'anthropic-sig' } },
			{ type: 'part-end', choice: 0, index: 0 },
			{ type: 'part-start', choice: 0, index: 1, part: { type: 'text', text: 'Hi' } },
			{ type: 'part-delta', choice: 0, index: 1, delta: { text: ' there' } },
			{ type: 'part-end', choice: 0, index: 1 },
			{
				type: 'part-start',
				choice: 0,
				index: 2,
				part: { type: 'tool-call', id: 'toolu_1', name: 'get_weather', arguments: '' },
			},
			{ type: 'part-delta', choice: 0, index: 2, delta: { arguments: '{"city":' } },
			{ type: 'part-delta', choice: 0, index: 2, delta: { arguments: '"Paris"}' } },
			{ type: 'part-end', choice: 0, index: 2 },
			{ type: 'finish', choice: 0, finishReason: 'tool-calls' },
			{ type: 'usage', usage: { inputTokens: 3, outputTokens: 5 } },
			{ type: 'native', api: ApiType.AnthropicMessages, value: { type: 'ping' } },
		];
		const output = [...events.flatMap((e) => encoder.push(e)), ...encoder.end()];
		const acc = accumulate(output);
		expect(acc.candidates[0]).toEqual({
			text: 'Hi there',
			thought: 'hmm',
			signatures: [],
			calls: [{ id: 'toolu_1', name: 'get_weather', args: { city: 'Paris' } }],
			finishReason: 'STOP',
		});
		expect(acc.usage).toEqual({ promptTokenCount: 3, candidatesTokenCount: 5 });
		expect(codes(ctx.diagnostics)).toEqual(['drop:stream.created', 'drop:stream.0:0.signature', 'drop:stream.native']);
	});

	it('flushes an unfinished tool call and pending finish on end', () => {
		const ctx = makeCtx(API, ApiType.OpenAIChatCompletions);
		const encoder = codec.createStreamEncoder(ctx);
		const out = [
			...encoder.push({
				type: 'part-start',
				choice: 0,
				index: 0,
				part: { type: 'tool-call', id: 'call_1', name: 'f', arguments: '{"a"' },
			}),
			...encoder.push({ type: 'part-delta', choice: 0, index: 0, delta: { arguments: ':1}' } }),
			...encoder.push({ type: 'finish', choice: 0, finishReason: 'stop' }),
			...encoder.push({ type: 'finish', choice: 0, finishReason: 'stop' }),
			...encoder.end(),
		];
		for (const chunk of out) GeminiGenerateContentResponseSchema.parse(chunk);
		expect(out).toEqual([
			{
				candidates: [
					{
						content: { role: 'model', parts: [{ functionCall: { id: 'call_1', name: 'f', args: { a: 1 } } }] },
						index: 0,
					},
				],
			},
			{ candidates: [{ index: 0, finishReason: 'STOP' }] },
		]);
		expect(codes(ctx.diagnostics)).toContain('lossy:stream.0.finish');
	});
});

describe('GeminiGenerateContentCodec cross-protocol encoding', () => {
	it('encodes a request from another protocol', () => {
		const ctx = makeCtx(ApiType.OpenAIChatCompletions, API);
		const request: GenerateMessageRequest = {
			model: 'gemini-2.5-pro',
			stream: true,
			messages: [
				{ role: 'system', content: [{ type: 'text', text: 'You are helpful' }] },
				{
					role: 'user',
					content: [
						{ type: 'text', text: 'Look' },
						{ type: 'image', url: 'data:image/png;base64,iVBO', detail: 'high' },
						{ type: 'image', url: 'https://example.com/a.png' },
						{ type: 'file', data: 'JVBE', mediaType: 'application/pdf', filename: 'a.pdf' },
						{ type: 'audio', data: 'UklG', format: 'wav' },
					],
				},
				{
					role: 'assistant',
					content: [
						{ type: 'reasoning', text: 'thinking', signature: { api: ApiType.AnthropicMessages, value: 'sig' } },
						{ type: 'reasoning', signature: { api: ApiType.OpenAIResponses, value: 'enc' }, redacted: true },
						{ type: 'text', text: 'Calling' },
						{ type: 'refusal', text: 'no' },
						{ type: 'tool-call', id: 'call_1', name: 'get_weather', arguments: '{"city":"Paris"}' },
						{
							type: 'tool-call',
							id: 'call_2',
							name: 'search',
							arguments: 'not json',
							signature: { api: ApiType.GoogleVertex, value: 'vertex-sig' },
						},
					],
				},
				{ role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call_1', content: '{"temp":20}' }] },
				{ role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call_2', content: 'plain text' }] },
				{
					role: 'user',
					content: [
						{ type: 'tool-result', toolCallId: 'call_x', content: [{ type: 'text', text: '{"ok":true}' }] },
						{ type: 'native', api: ApiType.AnthropicMessages, value: { type: 'container_upload' } },
					],
				},
				{ role: 'developer', content: [{ type: 'text', text: 'Be terse' }] },
			],
			tools: [
				{ type: 'function', name: 'get_weather', parameters: { type: 'object' }, strict: true },
				{ type: 'native', api: ApiType.AnthropicMessages, value: { type: 'web_search_20250305' } },
			],
			toolChoice: { type: 'tool', name: 'get_weather' },
			parallelToolCalls: true,
			responseFormat: { type: 'json_schema', name: 'out', schema: { type: 'object' } },
			reasoning: { effort: 'low', budgetTokens: 1024 },
			maxOutputTokens: 100,
			extensions: { [ApiType.OpenAIChatCompletions]: { logprobs: true } },
		};
		const wire = codec.encodeRequest(request, ctx);
		GeminiGenerateContentRequestSchema.parse(wire);
		expect(codec.requestPath?.(request, ctx)).toBe('/v1beta/models/gemini-2.5-pro:streamGenerateContent?alt=sse');
		expect(wire.systemInstruction).toEqual({ parts: [{ text: 'You are helpful' }, { text: 'Be terse' }] });
		expect(wire.contents).toEqual([
			{
				role: 'user',
				parts: [
					{ text: 'Look' },
					{ inlineData: { mimeType: 'image/png', data: 'iVBO' } },
					{ fileData: { fileUri: 'https://example.com/a.png' } },
					{ inlineData: { mimeType: 'application/pdf', data: 'JVBE' } },
					{ inlineData: { mimeType: 'audio/wav', data: 'UklG' } },
				],
			},
			{
				role: 'model',
				parts: [
					{ text: 'thinking', thought: true },
					{ text: 'Calling' },
					{ text: 'no' },
					{ functionCall: { id: 'call_1', name: 'get_weather', args: { city: 'Paris' } } },
					{ functionCall: { id: 'call_2', name: 'search', args: {} }, thoughtSignature: 'vertex-sig' },
				],
			},
			{
				role: 'user',
				parts: [
					{ functionResponse: { id: 'call_1', name: 'get_weather', response: { temp: 20 } } },
					{ functionResponse: { id: 'call_2', name: 'search', response: { result: 'plain text' } } },
				],
			},
			{ role: 'user', parts: [{ functionResponse: { id: 'call_x', name: 'call_x', response: { ok: true } } }] },
		]);
		expect(wire.tools).toEqual([
			{ functionDeclarations: [{ name: 'get_weather', parametersJsonSchema: { type: 'object' } }] },
		]);
		expect(wire.toolConfig).toEqual({ functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ['get_weather'] } });
		expect(wire.generationConfig).toEqual({
			maxOutputTokens: 100,
			responseMimeType: 'application/json',
			responseJsonSchema: { type: 'object' },
			thinkingConfig: { thinkingBudget: 1024, thinkingLevel: 'LOW' },
		});
		expect(codes(ctx.diagnostics)).toEqual([
			'drop:messages[1].content[1].detail',
			'lossy:messages[1].content[2].mediaType',
			'drop:messages[1].content[3].filename',
			'drop:messages[2].content[0].signature',
			'drop:messages[2].content[1].signature',
			'drop:messages[2].content[1]',
			'lossy:messages[2].content[3]',
			'lossy:messages[2].content[5].arguments',
			'lossy:messages[4].content[0].content',
			'lossy:messages[5].content[0].name',
			'drop:messages[5].content[1]',
			'reorder:messages[6]',
			'drop:tools[0].strict',
			'drop:tools[1]',
			'drop:responseFormat.name',
			'drop:parallelToolCalls',
			'drop:logprobs',
		]);
	});

	it('encodes a response from another protocol', () => {
		const ctx = makeCtx(API, ApiType.AnthropicMessages);
		ctx.request = {
			messages: [
				{ role: 'assistant', content: [{ type: 'tool-call', id: 'toolu_0', name: 'lookup', arguments: '{}' }] },
			],
		};
		const response: GenerateMessageResponse = {
			id: 'msg_1',
			model: 'claude-sonnet',
			created: 1700000000,
			choices: [
				{
					index: 0,
					finishReason: 'tool-calls',
					message: {
						role: 'assistant',
						content: [
							{ type: 'reasoning', text: 'think', signature: { api: ApiType.AnthropicMessages, value: 'sig' } },
							{ type: 'text', text: 'Hi', extensions: { [ApiType.AnthropicMessages]: { citations: [] } } },
							{ type: 'tool-call', id: 'toolu_1', name: 'get_weather', arguments: '{"city":"Paris"}' },
						],
					},
					extensions: { [ApiType.AnthropicMessages]: { stop_sequence: null } },
				},
			],
			usage: { inputTokens: 30, outputTokens: 12, reasoningTokens: 4, cacheWriteInputTokens: 10 },
		};
		const wire = codec.encodeResponse(response, ctx);
		GeminiGenerateContentResponseSchema.parse(wire);
		expect(wire).toEqual({
			candidates: [
				{
					content: {
						role: 'model',
						parts: [
							{ text: 'think', thought: true },
							{ text: 'Hi' },
							{ functionCall: { id: 'toolu_1', name: 'get_weather', args: { city: 'Paris' } } },
						],
					},
					finishReason: 'STOP',
					index: 0,
				},
			],
			usageMetadata: { promptTokenCount: 30, candidatesTokenCount: 8, thoughtsTokenCount: 4 },
			modelVersion: 'claude-sonnet',
			responseId: 'msg_1',
		});
		expect(codes(ctx.diagnostics)).toEqual([
			'drop:choices[0].message.content[0].signature',
			'drop:choices[0].message.content[1].citations',
			'drop:choices[0].stop_sequence',
			'drop:usage.cacheWriteInputTokens',
			'drop:created',
		]);
	});

	it('uses tool names from the request for tool results in a response-less exchange', () => {
		const ctx = makeCtx(ApiType.AnthropicMessages, API);
		const wire = codec.encodeRequest(
			{
				messages: [
					{ role: 'assistant', content: [{ type: 'tool-call', id: 't1', name: 'calc', arguments: '{}' }] },
					{
						role: 'user',
						content: [
							{ type: 'tool-result', toolCallId: 't1', content: 'boom', isError: true },
							{ type: 'text', text: 'continue' },
						],
					},
				],
			},
			ctx,
		);
		expect(wire.contents[1]).toEqual({
			role: 'user',
			parts: [{ functionResponse: { id: 't1', name: 'calc', response: { error: 'boom' } } }, { text: 'continue' }],
		});
		expect(ctx.diagnostics).toEqual([]);
	});
});

describe('GeminiGenerateContentCodec errors', () => {
	const cases: [string, number, string][] = [
		['INVALID_ARGUMENT', 400, 'invalid-request'],
		['FAILED_PRECONDITION', 400, 'invalid-request'],
		['UNAUTHENTICATED', 401, 'authentication'],
		['PERMISSION_DENIED', 403, 'permission'],
		['NOT_FOUND', 404, 'not-found'],
		['RESOURCE_EXHAUSTED', 429, 'rate-limit'],
		['UNAVAILABLE', 503, 'overloaded'],
		['DEADLINE_EXCEEDED', 504, 'timeout'],
		['INTERNAL', 500, 'server'],
	];
	for (const [status, code, kind] of cases) {
		it(`round trips ${status}`, () => {
			const body = {
				error: {
					code,
					message: `${status} happened`,
					status,
					details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'X' }],
				},
			};
			const ctx = makeCtx();
			const decoded = codec.decodeError({ status: code, body: structuredClone(body) }, ctx);
			expect(decoded).toMatchObject({ kind, status: code, code: status, message: `${status} happened` });
			const encoded = codec.encodeError(decoded, ctx);
			expect(encoded).toStrictEqual({ status: code, body });
			GeminiErrorResponseSchema.parse(encoded.body);
			expect(ctx.diagnostics).toEqual([]);
		});
	}

	it('round trips array-wrapped stream errors', () => {
		const body = [{ error: { code: 429, message: 'quota', status: 'RESOURCE_EXHAUSTED' } }];
		const ctx = makeCtx();
		const decoded = codec.decodeError({ status: 429, body: structuredClone(body) }, ctx);
		expect(decoded.kind).toBe('rate-limit');
		expect(codec.encodeError(decoded, ctx)).toStrictEqual({ status: 429, body });
	});

	it('maps kinds of other protocols to Gemini statuses', () => {
		const ctx = makeCtx(API, ApiType.OpenAIChatCompletions);
		const encoded = codec.encodeError({ kind: 'rate-limit', message: 'slow down', code: 'rate_limit_exceeded' }, ctx);
		expect(encoded).toEqual({
			status: 429,
			body: { error: { code: 429, message: 'slow down', status: 'RESOURCE_EXHAUSTED' } },
		});
		GeminiErrorResponseSchema.parse(encoded.body);
		expect(codes(ctx.diagnostics)).toEqual(['drop:error.code']);
		expect(codec.encodeError({ kind: 'overloaded', message: 'busy', status: 529 }, makeCtx()).body).toEqual({
			error: { code: 529, message: 'busy', status: 'UNAVAILABLE' },
		});
	});

	it('decodes non-Gemini error bodies by HTTP status', () => {
		const ctx = makeCtx();
		expect(codec.decodeError({ status: 502, body: 'Bad Gateway' }, ctx)).toEqual({
			kind: 'server',
			message: 'Bad Gateway',
			status: 502,
		});
		expect(codec.decodeError({ status: 401, body: { message: 'nope' } }, ctx)).toMatchObject({
			kind: 'authentication',
			message: '{"message":"nope"}',
		});
	});
});
