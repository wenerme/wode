import { APICallError, generateText, stepCountIs, streamText, tool } from 'ai';
import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { type AiRouterFetch, createAiRouter } from '../../src/ai/router';
import {
	alias,
	answer,
	callId,
	chunkedSse,
	deferred,
	errorMessage,
	errorWire,
	inputTokens,
	outputTokens,
	type Protocol,
	type ProtocolName,
	protocols,
	responseWire,
	sdkModel,
	sseFrame,
	streamWire,
	textParts,
	toolInput,
	toolName,
	toolOutput,
	upstreamModel,
	type Wire,
} from './sdk-fixtures';

const options = { prompt: '北京天气如何？请调用 get_weather，然后回答。', maxRetries: 0, maxOutputTokens: 64 } as const;
type Exchange = { request: Request; body: Wire };

function harness(source: Protocol, target: Protocol, respond: (exchange: Exchange, round: number) => Response) {
	const upstream: Exchange[] = [];
	const downstream: Request[] = [];
	const wireResponses: Promise<string>[] = [];
	const wireFailures: unknown[] = [];
	let upstreamFailure: unknown;
	const upstreamFetch: AiRouterFetch = async (input, init) => {
		const request = new Request(input, init);
		const exchange = { request, body: (await request.json()) as Wire };
		upstream.push(exchange);
		try {
			return respond(exchange, upstream.length);
		} catch (error) {
			upstreamFailure = error;
			throw error;
		}
	};
	const app = createAiRouter({
		fetch: upstreamFetch,
		resolve: async (ctx) => {
			expect(ctx.request).toBeInstanceOf(Request);
			expect(ctx.signal).toBeInstanceOf(AbortSignal);
			expect(ctx.model).toBe(alias);
			expect(ctx.body).toBeTypeOf('object');
			return {
				api: target.api,
				baseURL: 'https://upstream.test',
				model: upstreamModel,
				headers: { authorization: 'Bearer resolver-only-token', 'x-upstream-fixture': 'yes' },
			};
		},
	});
	const bridge: AiRouterFetch = async (input, init) => {
		const request = new Request(input, init);
		downstream.push(request.clone());
		// This is the actual HTTP boundary under test; no socket or listening port.
		const response = await app.fetch(new Request(input, init));
		// Preserve assertion diagnostics: router correctly turns thrown fetch errors
		// into 502, but that must not hide a failing test oracle.
		if (upstreamFailure) throw upstreamFailure;
		wireResponses.push(
			response
				.clone()
				.text()
				.catch((error) => {
					wireFailures.push(error);
					return '';
				}),
		);
		return response;
	};
	return { model: sdkModel(source.name, bridge), upstream, downstream, wireResponses, wireFailures };
}

function assertRequest(exchange: Exchange, target: ProtocolName, streaming: boolean) {
	const { request, body } = exchange;
	const url = new URL(request.url);
	expect(request.method).toBe('POST');
	expect(url.origin).toBe('https://upstream.test');
	expect(request.headers.get('authorization')).toBe('Bearer resolver-only-token');
	expect(request.headers.get('x-upstream-fixture')).toBe('yes');
	expect(request.headers.get('x-api-key')).toBeNull();
	expect(request.headers.get('x-goog-api-key')).toBeNull();
	expect([...request.headers.values()].join(' ')).not.toContain('client-secret');
	if (target === 'gemini') {
		expect(url.pathname).toBe(
			`/v1beta/models/${upstreamModel}:${streaming ? 'streamGenerateContent' : 'generateContent'}`,
		);
		expect(url.searchParams.get('alt')).toBe(streaming ? 'sse' : null);
		expect(body).not.toHaveProperty('stream');
		expect(body).not.toHaveProperty('model');
		expect(body).toMatchObject({ contents: expect.any(Array), generationConfig: { maxOutputTokens: 64 } });
	} else {
		expect(url.pathname).toBe(
			{ chat: '/v1/chat/completions', responses: '/v1/responses', anthropic: '/v1/messages' }[target],
		);
		expect(body.model).toBe(upstreamModel);
		if (streaming) expect(body.stream).toBe(true);
		else expect(body.stream === undefined || body.stream === false).toBe(true);
		if (target === 'anthropic') expect(body.max_tokens).toBe(64);
	}
	expect(request.url).not.toContain(alias);
}

function assertUsage(usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number }, rounds = 1) {
	expect(usage.inputTokens).toBe(inputTokens * rounds);
	expect(usage.outputTokens).toBe(outputTokens * rounds);
	expect(usage.totalTokens).toBe((inputTokens + outputTokens) * rounds);
}

function assertTools(body: Wire, target: ProtocolName) {
	const parameters = { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] };
	if (target === 'gemini') {
		const declarations = (body.tools as { functionDeclarations: Wire[] }[]).flatMap(
			(tool) => tool.functionDeclarations,
		);
		const declaration = declarations.find((item) => item.name === toolName);
		expect(declaration).toBeDefined();
		// Native Gemini supports both its Schema dialect and JSON Schema.
		expect(declaration?.parametersJsonSchema ?? declaration?.parameters).toMatchObject(parameters);
		return;
	}
	const declaration =
		target === 'chat'
			? { type: 'function', function: { name: toolName, parameters } }
			: target === 'responses'
				? { type: 'function', name: toolName, parameters }
				: { name: toolName, input_schema: parameters };
	expect(body.tools).toEqual(
		expect.arrayContaining([
			expect.objectContaining(
				target === 'chat'
					? {
							...declaration,
							function: expect.objectContaining({ name: toolName, parameters: expect.objectContaining(parameters) }),
						}
					: target === 'responses'
						? { ...declaration, parameters: expect.objectContaining(parameters) }
						: target === 'anthropic'
							? { ...declaration, input_schema: expect.objectContaining(parameters) }
							: declaration,
			),
		]),
	);
}

function assertToolResult(body: Wire, target: ProtocolName, source: ProtocolName) {
	// Google SDK wraps a JSON tool result before serialization. Conversion must
	// preserve that actual SDK wire, including its content and tool name.
	const expected = source === 'gemini' ? { name: toolName, content: toolOutput } : toolOutput;
	// Inspect the actual second upstream wire, including the assistant call and
	// matching result. JSON search alone could accidentally match the tool schema.
	if (target === 'chat') {
		const messages = body.messages as Wire[];
		const assistant = messages.find((message) => message.role === 'assistant');
		const calls = assistant?.tool_calls as { id: string; function: { name: string; arguments: string } }[];
		expect(calls).toHaveLength(1);
		expect(calls[0].function.name).toBe(toolName);
		expect(JSON.parse(calls[0].function.arguments)).toEqual(toolInput);
		const result = messages.find((message) => message.role === 'tool');
		expect(result?.tool_call_id).toBe(calls[0].id);
		expect(JSON.parse(result?.content as string)).toEqual(expected);
	} else if (target === 'responses') {
		const items = body.input as Wire[];
		const call = items.find((item) => item.type === 'function_call');
		expect(call).toMatchObject({ name: toolName });
		expect(JSON.parse(call?.arguments as string)).toEqual(toolInput);
		const result = items.find((item) => item.type === 'function_call_output');
		expect(result?.call_id).toBe(call?.call_id);
		expect(JSON.parse(result?.output as string)).toEqual(expected);
	} else if (target === 'anthropic') {
		const blocks = (body.messages as { content: Wire[] }[]).flatMap((message) =>
			Array.isArray(message.content) ? message.content : [],
		);
		const call = blocks.find((part) => part.type === 'tool_use');
		expect(call).toMatchObject({ name: toolName, input: toolInput });
		const result = blocks.find((part) => part.type === 'tool_result');
		expect(result?.tool_use_id).toBe(call?.id);
		const content = result?.content;
		const text =
			typeof content === 'string' ? content : (content as { text: string }[]).map((part) => part.text).join('');
		expect(JSON.parse(text)).toEqual(expected);
	} else {
		const parts = (body.contents as { parts: Wire[] }[]).flatMap((message) => message.parts);
		expect(parts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ functionCall: expect.objectContaining({ name: toolName, args: toolInput }) }),
			]),
		);
		const result = parts.find((part) => part.functionResponse)?.functionResponse as Wire;
		expect(result?.name).toBe(toolName);
		// Gemini's functionResponse.response is a structured JSON object.
		expect(result?.response).toEqual(expected);
	}
}

function assertSseEnvelope(source: ProtocolName, wire: string) {
	const frames = wire
		.replaceAll('\r\n', '\n')
		.split('\n\n')
		.filter((frame) => frame.includes('data:'));
	expect(frames.length).toBeGreaterThan(1);
	if (source === 'chat') {
		expect(frames.filter((frame) => frame.trim() === 'data: [DONE]')).toHaveLength(1);
	} else if (source === 'anthropic' || source === 'responses') {
		for (const frame of frames) {
			const data = frame
				.split('\n')
				.find((line) => line.startsWith('data:'))
				?.slice(5)
				.trim();
			if (!data || data === '[DONE]') continue;
			const event = JSON.parse(data) as Wire;
			expect(frame.split('\n')).toContain(`event: ${event.type}`);
		}
	}
}

async function beforeDeadline<T>(promise: Promise<T>, ms = 2_000): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([
			promise,
			new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new Error('SDK did not receive a text delta before upstream completion')), ms);
			}),
		]);
	} finally {
		clearTimeout(timer);
	}
}

// Independent controls prove the hand-authored upstream wire is accepted by its
// own real SDK. Router failures cannot be attributed to a codec-generated oracle.
describe('native wire fixture controls (real SDK, without conversion)', () => {
	for (const protocol of protocols) {
		for (const streaming of [false, true]) {
			test(`${protocol.name} ${streaming ? 'streamText' : 'generateText'} tool round trip`, async () => {
				let round = 0;
				const upstream: AiRouterFetch = async () => {
					expect(++round).toBeLessThanOrEqual(2);
					const kind = round === 1 ? 'tool' : 'text';
					return streaming
						? chunkedSse(streamWire(protocol.name, kind))
						: Response.json(responseWire(protocol.name, kind));
				};
				const execute = vi.fn(async () => toolOutput);
				const request = {
					...options,
					model: sdkModel(protocol.name, upstream),
					stopWhen: stepCountIs(2),
					tools: { [toolName]: tool({ inputSchema: z.object({ city: z.string() }), execute }) },
				};
				const result = streaming ? streamText(request) : await generateText(request);
				if ('consumeStream' in result) await result.consumeStream();
				expect(await result.text).toBe(answer);
				expect(execute).toHaveBeenCalledTimes(1);
				expect((await result.steps)[0].toolCalls[0]).toMatchObject({ toolName, input: toolInput });
				assertUsage(await result.totalUsage, 2);
				expect(round).toBe(2);
			});
		}
		test(`${protocol.name} native SSE error capability`, async () => {
			const upstream: AiRouterFetch = async () => chunkedSse(streamWire(protocol.name, 'error'));
			const result = streamText({ ...options, model: sdkModel(protocol.name, upstream), onError: () => {} });
			const errors: unknown[] = [];
			let text = '';
			for await (const part of result.fullStream) {
				if (part.type === 'error') errors.push(part.error);
				if (part.type === 'text-delta') text += part.text;
			}
			expect(text).toBe(textParts[0]);
			if (protocol.name === 'gemini') expect(errors).toEqual([]);
			else {
				expect(errors).toHaveLength(1);
				expect(errors[0] instanceof Error ? errors[0].message : JSON.stringify(errors[0])).toContain(errorMessage);
			}
		});
	}
});

for (const source of protocols) {
	for (const target of protocols) {
		describe(`${source.name} SDK → Hono → ${target.name}`, () => {
			test('generateText: native response, model alias, usage and credential isolation', async () => {
				const h = harness(source, target, () => Response.json(responseWire(target.name)));
				const result = await generateText({ ...options, model: h.model });
				expect(result.text).toBe(answer);
				expect(result.finishReason).toBe('stop');
				expect(result.toolCalls).toEqual([]);
				assertUsage(result.usage);
				expect(h.upstream).toHaveLength(1);
				assertRequest(h.upstream[0], target.name, false);
			});

			test('streamText: incremental SSE across UTF-8 boundaries, usage and event framing', async () => {
				const gate = deferred();
				const h = harness(source, target, () => chunkedSse(streamWire(target.name), gate.promise));
				const result = streamText({ ...options, model: h.model });
				const reader = result.textStream[Symbol.asyncIterator]();
				const first = reader.next();
				let text = '';
				try {
					const part = await beforeDeadline(first);
					expect(part.done).toBe(false);
					expect(part.value).toBe(textParts[0]);
					text += part.value;
				} finally {
					gate.resolve();
				}
				for (let part = await reader.next(); !part.done; part = await reader.next()) text += part.value;
				expect(text).toBe(answer);
				expect(await result.text).toBe(answer);
				expect(await result.finishReason).toBe('stop');
				assertUsage(await result.usage);
				expect(h.upstream).toHaveLength(1);
				assertRequest(h.upstream[0], target.name, true);
				assertSseEnvelope(source.name, await h.wireResponses[0]);
				if (source.name === 'gemini') {
					expect(new URL(h.downstream[0].url).pathname).toContain(':streamGenerateContent');
					expect(await h.downstream[0].json()).not.toHaveProperty('stream');
				}
			});

			for (const streaming of [false, true]) {
				test(`${streaming ? 'streamText' : 'generateText'}: execute tool and send result in second round`, async () => {
					const execute = vi.fn(async (input: { city: string }) => {
						expect(input).toEqual(toolInput);
						return toolOutput;
					});
					const h = harness(source, target, ({ body }, round) => {
						expect(round).toBeLessThanOrEqual(2);
						assertTools(body, target.name);
						if (round === 2) assertToolResult(body, target.name, source.name);
						const kind = round === 1 ? 'tool' : 'text';
						return streaming
							? chunkedSse(streamWire(target.name, kind))
							: Response.json(responseWire(target.name, kind));
					});
					const request = {
						...options,
						model: h.model,
						stopWhen: stepCountIs(2),
						tools: {
							[toolName]: tool({
								description: 'Get weather for a city',
								inputSchema: z.object({ city: z.string() }),
								execute,
							}),
						},
						// Responses must resend the concrete call/result through the router.
						providerOptions: { openai: { store: false } },
					};
					const result = streaming ? streamText(request) : await generateText(request);
					if ('consumeStream' in result) await result.consumeStream();
					expect(await result.text).toBe(answer);
					expect(execute).toHaveBeenCalledTimes(1);
					const steps = await result.steps;
					expect(steps).toHaveLength(2);
					expect(steps[0].finishReason).toBe('tool-calls');
					expect(steps[0].toolCalls).toHaveLength(1);
					expect(steps[0].toolCalls[0]).toMatchObject({ toolName, input: toolInput });
					expect(steps[0].toolCalls[0].toolCallId).toBeTruthy();
					if (source.name !== 'gemini' && target.name !== 'gemini')
						expect(steps[0].toolCalls[0].toolCallId).toBe(callId);
					expect(steps[0].toolResults[0]).toMatchObject({ toolName, output: toolOutput });
					expect(steps[1].finishReason).toBe('stop');
					for (const step of steps) assertUsage(step.usage);
					assertUsage(await result.totalUsage, 2);
					expect(h.upstream).toHaveLength(2);
					for (const exchange of h.upstream) assertRequest(exchange, target.name, streaming);
					if (streaming) for (const wire of await Promise.all(h.wireResponses)) assertSseEnvelope(source.name, wire);
				});
			}

			test('HTTP 429 reaches the SDK without retries', async () => {
				const h = harness(source, target, () =>
					Response.json(errorWire(target.name), { status: 429, headers: { 'retry-after': '1' } }),
				);
				let caught: unknown;
				try {
					await generateText({ ...options, model: h.model });
				} catch (error) {
					caught = error;
				}
				expect(APICallError.isInstance(caught)).toBe(true);
				expect(caught).toMatchObject({ statusCode: 429, message: expect.stringContaining(errorMessage) });
				expect(h.upstream).toHaveLength(1);
				assertRequest(h.upstream[0], target.name, false);
			});

			test('SSE in-band error reaches SDK fullStream after partial text', async () => {
				const gate = deferred();
				const h = harness(source, target, () => chunkedSse(streamWire(target.name, 'error'), gate.promise));
				const observedErrors: unknown[] = [];
				const result = streamText({
					...options,
					model: h.model,
					onError: ({ error }) => {
						observedErrors.push(error);
					},
				});
				const errors: unknown[] = [];
				let text = '';
				try {
					for await (const part of result.fullStream) {
						if (part.type === 'error') errors.push(part.error);
						if (part.type === 'text-delta') {
							text += part.text;
							gate.resolve();
						}
					}
				} catch (error) {
					errors.push(error);
				} finally {
					gate.resolve();
				}
				expect(text).toBe(textParts[0]);
				expect(h.upstream).toHaveLength(1);
				assertRequest(h.upstream[0], target.name, true);
				const wire = await h.wireResponses[0];
				if (source.name === 'gemini') {
					// Google's SDK ignores error data, so the router must also fail the Fetch body.
					expect(h.wireFailures).toHaveLength(1);
				} else {
					expect(wire).toContain(errorMessage);
					if (source.name !== 'chat') assertSseEnvelope(source.name, wire);
					expect(observedErrors).toHaveLength(1);
				}
				expect(errors).toHaveLength(1);
				const error = errors[0];
				expect(error instanceof Error ? `${error.message} ${error.cause ?? ''}` : JSON.stringify(error)).toContain(
					errorMessage,
				);
			});
		});
	}
}

describe('Responses failed status reaches every SDK as an error', () => {
	const target = protocols[1];
	const failed = {
		...responseWire('responses'),
		status: 'failed',
		error: { code: 'server_error', message: errorMessage },
		output: [
			{
				id: 'msg_fixture',
				type: 'message',
				role: 'assistant',
				status: 'incomplete',
				content: [{ type: 'output_text', text: textParts[0], annotations: [] }],
			},
		],
	};
	for (const source of protocols) {
		test(`${source.name}: failed JSON with partial output cannot become stop`, async () => {
			const h = harness(source, target, () => Response.json(failed));
			let caught: unknown;
			try {
				await generateText({ ...options, model: h.model });
			} catch (error) {
				caught = error;
			}
			expect(APICallError.isInstance(caught)).toBe(true);
			expect(caught).toMatchObject({ statusCode: 500, message: expect.stringContaining(errorMessage) });
		});

		test(`${source.name}: response.failed after text cannot complete successfully`, async () => {
			const fixture = streamWire('responses');
			const gate = deferred();
			const h = harness(source, target, () =>
				chunkedSse(
					{
						prefix: fixture.prefix,
						suffix: sseFrame('responses', { type: 'response.failed', sequence_number: 99, response: failed }),
					},
					gate.promise,
				),
			);
			const observedErrors: unknown[] = [];
			const result = streamText({
				...options,
				model: h.model,
				onError: ({ error }) => {
					observedErrors.push(error);
				},
			});
			const errors: unknown[] = [];
			let text = '';
			try {
				for await (const part of result.fullStream) {
					if (part.type === 'error') errors.push(part.error);
					if (part.type === 'text-delta') {
						text += part.text;
						gate.resolve();
					}
				}
			} catch (error) {
				errors.push(error);
			} finally {
				gate.resolve();
			}
			expect(text).toBe(textParts[0]);
			expect(errors).toHaveLength(1);
			if (source.name !== 'gemini') expect(observedErrors).toHaveLength(1);
			expect(await Promise.resolve(result.finishReason).catch(() => 'error')).not.toBe('stop');
		});
	}
});
