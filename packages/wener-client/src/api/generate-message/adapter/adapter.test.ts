import { describe, expect, it } from 'vitest';
import { ApiType } from '../../schema/ApiType';
import { createGenerateMessageAdapter } from './adapter';
import type { GenerateMessageCodec } from './codec';
import {
	defaultRequestProcessor,
	GenerateMessageDiagnosticError,
	type GenerateMessageProcessor,
	strictProcessor,
} from './processor';
import type { GenerateMessageStreamEvent } from './types';
import { applyExtensions, pickExtensions } from './utils';

type FakeRequest = { model?: string; max?: number; messages: { role: string; text: string }[]; [key: string]: unknown };
type FakeResponse = { text: string; [key: string]: unknown };
type FakeEvent = { kind: string; text?: string };

/** Minimal codec: one text part per message, unknown top-level fields kept as extensions. */
function fakeCodec(api: ApiType): GenerateMessageCodec<FakeRequest, FakeResponse, FakeEvent> {
	return {
		api,
		decodeRequest: (wire) => ({
			model: wire.model,
			maxOutputTokens: wire.max,
			messages: wire.messages.map((m) => ({ role: m.role, content: [{ type: 'text', text: m.text }] })),
			extensions: pickExtensions(api, wire, ['model', 'max', 'messages']),
		}),
		encodeRequest: (request, ctx) =>
			applyExtensions(
				api,
				request,
				{
					model: request.model,
					max: request.maxOutputTokens,
					messages: request.messages.map((m) => ({
						role: m.role,
						text: m.content.map((p) => (p.type === 'text' ? p.text : '')).join(''),
					})),
				},
				ctx,
				'',
			),
		decodeResponse: (wire) => ({
			choices: [{ index: 0, message: { role: 'assistant', content: [{ type: 'text', text: wire.text }] } }],
		}),
		encodeResponse: (response) => {
			const part = response.choices[0]?.message.content[0];
			return { text: part?.type === 'text' ? part.text : '' };
		},
		createStreamDecoder: () => ({
			push: (event) => (event.text ? [{ type: 'part-delta', choice: 0, index: 0, delta: { text: event.text } }] : []),
			end: () => [{ type: 'finish', choice: 0, finishReason: 'stop' }],
		}),
		createStreamEncoder: () => ({
			push: (event) =>
				event.type === 'part-delta' ? [{ kind: 'delta', text: event.delta.text }] : [{ kind: event.type }],
			end: () => [{ kind: 'done' }],
		}),
		decodeError: ({ status, body }) => ({ kind: 'server', status, message: String(body) }),
		encodeError: (error) => ({ status: error.status ?? 500, body: { message: error.message, kind: error.kind } }),
		requestPath: (request) => `/${request.model}`,
	};
}

const A = ApiType.OpenAIChatCompletions;
const B = ApiType.AnthropicMessages;
const codecs = new Map<ApiType, GenerateMessageCodec<FakeRequest, FakeResponse, FakeEvent>>([
	[A, fakeCodec(A)],
	[B, fakeCodec(B)],
]);
const getCodec = (api: ApiType) => codecs.get(api) as GenerateMessageCodec | undefined;

describe('createGenerateMessageAdapter', () => {
	it('runs processors by priority then registration order', async () => {
		const calls: string[] = [];
		const track = (name: string, priority?: number): GenerateMessageProcessor => ({
			name,
			priority,
			onRequest: () => {
				calls.push(name);
			},
		});
		const adapter = createGenerateMessageAdapter({
			source: A,
			target: B,
			getCodec,
			processors: [track('a'), track('high', 10), track('b'), track('low', -1)],
		});
		await adapter.request({ model: 'm', messages: [] });
		expect(calls).toEqual(['high', 'a', 'b', 'low']);
	});

	it('skips disabled processors and shares state across phases', async () => {
		const adapter = createGenerateMessageAdapter({
			source: A,
			target: B,
			getCodec,
			processors: [
				{ name: 'off', enabled: () => false, onRequest: () => ({ messages: [], model: 'never' }) },
				{
					name: 'state',
					onRequest: (request, ctx) => {
						ctx.state.set('model', request.model);
					},
					onResponse: (response, ctx) => ({ ...response, model: String(ctx.state.get('model')) }),
				},
			],
		});
		const { body, path } = await adapter.request({ model: 'm1', messages: [{ role: 'user', text: 'hi' }] });
		expect(body).toEqual({ model: 'm1', messages: [{ role: 'user', text: 'hi' }] });
		expect(path).toBe('/m1');
		expect(adapter.context.request?.model).toBe('m1');
		expect(adapter.context.state.get('model')).toBe('m1');
	});

	it('rewrites parts, splits and removes them', async () => {
		const adapter = createGenerateMessageAdapter({
			source: A,
			target: B,
			getCodec,
			processors: [
				{
					name: 'parts',
					onPart: (part, _ctx, meta) => {
						expect(meta.direction).toBe('request');
						if (part.type !== 'text') return undefined;
						if (part.text === 'drop') return null;
						return [part, { type: 'text', text: '!' }];
					},
				},
			],
		});
		const { body } = await adapter.request({
			messages: [
				{ role: 'user', text: 'a' },
				{ role: 'user', text: 'drop' },
			],
		});
		expect((body as FakeRequest).messages).toEqual([
			{ role: 'user', text: 'a!' },
			{ role: 'user', text: '' },
		]);
	});

	it('keeps same-protocol extensions and reports foreign ones', async () => {
		const same = createGenerateMessageAdapter({ source: A, target: A, getCodec });
		expect((await same.request({ messages: [], vendor: 1 })).body).toEqual({ messages: [], vendor: 1 });
		expect(same.context.diagnostics).toEqual([]);

		const cross = createGenerateMessageAdapter({ source: A, target: B, getCodec });
		expect((await cross.request({ messages: [], vendor: 1 })).body).toEqual({ messages: [] });
		expect(cross.context.diagnostics).toEqual([
			{ code: 'drop', path: 'vendor', message: `${A} field has no ${B} mapping`, api: A },
		]);
	});

	it('fails on diagnostics with strictProcessor', async () => {
		const adapter = createGenerateMessageAdapter({ source: A, target: B, getCodec, processors: [strictProcessor()] });
		await expect(adapter.request({ messages: [], vendor: 1 })).rejects.toBeInstanceOf(GenerateMessageDiagnosticError);
	});

	it('fills absent request fields with defaultRequestProcessor', async () => {
		const adapter = createGenerateMessageAdapter({
			source: A,
			target: B,
			getCodec,
			processors: [defaultRequestProcessor({ maxOutputTokens: 256 })],
		});
		expect((await adapter.request({ messages: [] })).body).toMatchObject({ max: 256 });
		expect(adapter.context.diagnostics.map((d) => d.code)).toEqual(['default']);
		const explicit = createGenerateMessageAdapter({
			source: A,
			target: B,
			getCodec,
			processors: [defaultRequestProcessor({ maxOutputTokens: 256 })],
		});
		expect((await explicit.request({ messages: [], max: 8 })).body).toMatchObject({ max: 8 });
	});

	it('applies downstream and upstream wire hooks', async () => {
		const adapter = createGenerateMessageAdapter({
			source: A,
			target: B,
			getCodec,
			processors: [
				{ name: 'up', onUpstreamRequest: (wire) => ({ ...(wire as object), patched: true }) },
				{ name: 'down', onDownstreamResponse: (wire) => ({ ...(wire as object), down: true }) },
			],
		});
		expect((await adapter.request({ messages: [] })).body).toMatchObject({ patched: true });
		expect(await adapter.response({ text: 'ok' })).toEqual({ text: 'ok', down: true });
	});

	it('converts stream events with one-to-many, drop and trailing events', () => {
		const adapter = createGenerateMessageAdapter({
			source: A,
			target: B,
			getCodec,
			processors: [
				{
					name: 'split',
					onStreamEvent: (event) => {
						if (event.type !== 'part-delta') return undefined;
						if (event.delta.text === 'skip') return [];
						return [...(event.delta.text ?? '')].map(
							(text): GenerateMessageStreamEvent => ({ ...event, delta: { text } }),
						);
					},
					onStreamEnd: () => [{ type: 'usage', usage: { outputTokens: 2 } }],
				},
			],
		});
		const stream = adapter.stream();
		expect(stream.push({ kind: 'x', text: 'ab' })).toEqual([
			{ kind: 'delta', text: 'a' },
			{ kind: 'delta', text: 'b' },
		]);
		expect(stream.push({ kind: 'x', text: 'skip' })).toEqual([]);
		expect(stream.end()).toEqual([{ kind: 'finish' }, { kind: 'usage' }, { kind: 'done' }]);
	});

	it('makes stream end idempotent', () => {
		let decoderEnds = 0;
		let encoderEnds = 0;
		let processorEnds = 0;
		const base = fakeCodec(A);
		const counted: GenerateMessageCodec<FakeRequest, FakeResponse, FakeEvent> = {
			...base,
			createStreamDecoder: (ctx) => {
				const decoder = base.createStreamDecoder(ctx);
				return {
					push: decoder.push,
					end: () => {
						decoderEnds++;
						return decoder.end();
					},
				};
			},
			createStreamEncoder: (ctx) => {
				const encoder = base.createStreamEncoder(ctx);
				return {
					push: encoder.push,
					end: () => {
						encoderEnds++;
						return encoder.end();
					},
				};
			},
		};
		const adapter = createGenerateMessageAdapter({
			source: A,
			target: A,
			getCodec: () => counted,
			processors: [
				{
					name: 'end-count',
					onStreamEnd: () => {
						processorEnds++;
						return undefined;
					},
				},
			],
		});
		const stream = adapter.stream();
		expect(stream.end()).toEqual([{ kind: 'finish' }, { kind: 'done' }]);
		expect(stream.end()).toEqual([]);
		expect(stream.push({ kind: 'ignored' })).toEqual([]);
		expect({ decoderEnds, encoderEnds, processorEnds }).toEqual({ decoderEnds: 1, encoderEnds: 1, processorEnds: 1 });
	});

	it('maps errors through onError', async () => {
		const adapter = createGenerateMessageAdapter({
			source: A,
			target: B,
			getCodec,
			processors: [{ name: 'err', onError: (error) => ({ ...error, kind: 'overloaded', status: 503 }) }],
		});
		expect(await adapter.error({ status: 500, body: 'boom' })).toEqual({
			status: 503,
			body: { message: 'boom', kind: 'overloaded' },
		});
	});

	it('requires codecs for both protocols', () => {
		expect(() => createGenerateMessageAdapter({ source: ApiType.Rerank, target: B, getCodec })).toThrow(
			/No GenerateMessage codec/,
		);
	});
});
