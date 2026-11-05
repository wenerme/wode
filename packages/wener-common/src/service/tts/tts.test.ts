import { describe, expect, it, vi } from 'vitest';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import * as ttsClients from '@wener/client/tts';
import type { TtsAudio, TtsClient } from '@wener/client/tts';
import type { CliServiceConfig } from '../config';
import { EdgeTtsServiceProvider } from '../provider/edge-tts/EdgeTtsServiceProvider';
import { OpenAiTtsServiceProvider } from '../provider/openai-tts/OpenAiTtsServiceProvider';
import { ServiceRegistry, type ServiceProviderDefinition } from '../registry';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import { createTtsServiceToolClient } from './client';
import { EdgeTtsServiceOptionsSchema, OpenAiTtsServiceOptionsSchema, resolveOpenAiTtsConnectionOptions } from './config';
import { TtsServiceCapability, type ITtsService } from './ITtsService';
import { TtsServiceContract } from './TtsServiceContract';
import { createTtsService } from './server';
import { TTS_MAX_AUDIO_BYTES, TtsAudioWireSchema, TtsRequestSchema } from './input';
import { TtsOperations } from './operations';
import { TtsTools } from './tools';
import { decodeTtsAudio, encodeTtsAudio } from './transport';

const audio: TtsAudio = { audio: new Uint8Array([0, 1, 127, 128, 255]), format: 'mp3', mediaType: 'audio/mpeg', voice: 'voice', model: 'model' };
const wire = { audioBase64: 'AAF/gP8=', format: 'mp3', mediaType: 'audio/mpeg', voice: 'voice', model: 'model', byteLength: 5 };
const voices = { supported: true, voices: [{ id: 'zh-CN-XiaoxiaoNeural', locale: 'zh-CN' }] };
const source = (): TtsClient => ({ synthesize: vi.fn(async () => audio), listVoices: vi.fn(async () => voices), close: vi.fn(async () => {}) });

describe('TTS service contract and transport', () => {
	it('keeps the SDK binary and owns the source close through the registry', async () => {
		const client = source();
		const definition: ServiceProviderDefinition<ITtsService> = { ...OpenAiTtsServiceProvider, create: () => ({ tts: createTtsService(client, 'mock') }) };
		const registry = new ServiceRegistry({ context: { services: { speech: { provider: 'openai-tts', readOnly: true } } } });
		registry.register(definition);
		const service = await registry.load(TtsServiceCapability, 'speech');
		expect(service.readOnly).toBe(true);
		const options = { signal: new AbortController().signal };
		expect(await service.synthesize({ text: 'test' }, options)).toBe(audio);
		expect(client.synthesize).toHaveBeenCalledExactlyOnceWith({ text: 'test' }, options);
		expect(await TtsOperations.synthesize.execute(registry, 'speech', { text: 'test' }, options)).toEqual(wire);
		expect(await TtsOperations.listVoices.execute(registry, 'speech', {}, options)).toEqual(voices);
		expect(client.listVoices).toHaveBeenCalledExactlyOnceWith({}, options);
		await registry.close();
		await registry.close();
		expect(client.close).toHaveBeenCalledTimes(1);
	});

	it('discovers both providers with JSON input/output and TypeScript contracts without factory/env/HTTP/socket', async () => {
		const getEnv = vi.fn(() => { throw new Error('must not resolve'); });
		const fetch = vi.fn<typeof globalThis.fetch>();
		const socketFactory = vi.fn((): never => { throw new Error('must not connect'); });
		for (const provider of [EdgeTtsServiceProvider, OpenAiTtsServiceProvider]) {
			const create = vi.fn(provider.create);
			const definition = { ...provider, create };
			const config: CliServiceConfig = { provider: provider.name, readOnly: true, options: provider.name === 'openai-tts' ? { apiKey: 'env://TEST_TTS_KEY' } : {} };
			const runtime = createServiceRuntime({ context: { services: { speech: config } },
				providers: new ServiceProviderRegistry([createServiceProviderAdapter(definition)]), fetch, getEnv, edgeTtsSocketFactory: socketFactory });
			const schema = await runtime.getSchema({ params: { service: 'speech' } });
			expect(schema.tools).toEqual(TtsTools);
			for (const [name, tool] of Object.entries(schema.tools)) {
				expect(tool.annotations).toEqual({ readOnlyHint: true, destructiveHint: false });
				expect(tool.inputSchema.type).toBe('object');
				expect(tool.outputSchema?.type).toBe('object');
				expect(TtsServiceContract.methods[name]).toMatchObject({ inputType: expect.any(String), outputType: expect.any(String) });
			}
			schema.tools.synthesize.inputSchema.type = 'mutated';
			expect((await runtime.getSchema({ params: { service: 'speech' } })).tools.synthesize.inputSchema.type).toBe('object');
			expect(create).not.toHaveBeenCalled();
			await runtime.close();
		}
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		expect(socketFactory).not.toHaveBeenCalled();
		expect(EdgeTtsServiceProvider).toMatchObject({ name: 'edge-tts', aliases: ['edge'], provides: ['tts'] });
		expect(OpenAiTtsServiceProvider).toMatchObject({ name: 'openai-tts', aliases: ['openai-speech'], provides: ['tts'] });
	});

	it.each(['apiKeyEnv', 'reference', 'none'])('resolves %s lazily and keeps config defaults overridable on readonly POST synthesis', async (kind) => {
		const getEnv = vi.fn(() => 'fixture-key');
		const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(new Uint8Array([73, 68, 51, 1]), { headers: { 'content-type': 'audio/mpeg' } }));
		const options = { model: 'configured-model', voice: 'configured-voice',
			...(kind === 'apiKeyEnv' ? { apiKeyEnv: 'TEST_TTS_KEY' } : kind === 'reference' ? { apiKey: 'env://TEST_TTS_KEY' } : {}) };
		const config = { provider: 'openai-speech', readOnly: true, baseUrl: 'https://speech.example.test/v1/', options };
		const runtime = createServiceRuntime({ context: { services: { speech: config } },
			providers: new ServiceProviderRegistry([createServiceProviderAdapter(OpenAiTtsServiceProvider)]), getEnv, fetch });
		const client = await createTtsServiceToolClient(runtime, 'speech');
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		const result = await client.synthesize({ text: 'test', model: 'override-model', voice: 'override-voice' });
		expect(result.audio).toEqual(new Uint8Array([73, 68, 51, 1]));
		expect(result).toMatchObject({ model: 'override-model', voice: 'override-voice' });
		expect(getEnv).toHaveBeenCalledTimes(kind === 'none' ? 0 : 1);
		const request = fetch.mock.calls[0][1];
		expect(request?.method).toBe('POST');
		expect(new Headers(request?.headers).get('authorization')).toBe(kind === 'none' ? null : 'Bearer fixture-key');
		expect(JSON.parse(request?.body as string)).toMatchObject({ model: 'override-model', voice: 'override-voice' });
		expect(await client.listVoices()).toEqual({ supported: false, voices: [] });
		expect(fetch).toHaveBeenCalledTimes(1);
		await runtime.close();
	});

	it.each(['unknown', 'invalid', 'cancelled'])('rejects %s before credentials or factory', async (kind) => {
		const getEnv = vi.fn(() => 'fixture-key');
		const create = vi.fn(OpenAiTtsServiceProvider.create);
		const config = { provider: 'openai-tts', readOnly: true, options: { apiKeyEnv: 'TEST_TTS_KEY' } };
		const client = await createServiceProviderAdapter({ ...OpenAiTtsServiceProvider, create }).create({
			name: 'speech', config, context: { services: { speech: config } }, fetch: globalThis.fetch, getEnv,
		});
		await expect(client.call(kind === 'unknown' ? 'missing' : 'synthesize', kind === 'invalid' ? { text: '' } : { text: 'test' },
			kind === 'cancelled' ? { signal: AbortSignal.abort() } : {})).rejects.toThrow();
		expect(getEnv).not.toHaveBeenCalled();
		expect(create).not.toHaveBeenCalled();
		await client.close?.();
	});

	it('does not invent a model or invoke a model HTTP API before explicit selection', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>();
		const service = OpenAiTtsServiceProvider.create({ name: 'speech', config: { provider: 'openai-tts', readOnly: true }, context: { services: {} }, fetch });
		const { tts } = await service;
		expect(await tts.listVoices()).toEqual({ supported: false, voices: [] });
		await expect(tts.synthesize({ text: 'test' })).rejects.toThrow('model is required');
		expect(fetch).not.toHaveBeenCalled();
		await tts.close();
	});

	it('passes common schema inputs with own undefined prosody fields through OpenAI', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(new Uint8Array([73, 68, 51, 1]), { headers: { 'content-type': 'audio/mpeg' } }));
		const config = { provider: 'openai-tts', readOnly: true, options: { model: 'explicit-model' } };
		const runtime = createServiceRuntime({ context: { services: { speech: config } }, fetch,
			providers: new ServiceProviderRegistry([createServiceProviderAdapter(OpenAiTtsServiceProvider)]) });
		const client = await createTtsServiceToolClient(runtime, 'speech');
		const input = TtsRequestSchema.parse({ text: 'test', rate: undefined, pitch: undefined, volume: undefined });
		expect(Object.hasOwn(input, 'rate')).toBe(true);
		expect(Object.hasOwn(input, 'pitch')).toBe(true);
		expect(Object.hasOwn(input, 'volume')).toBe(true);
		expect((await client.synthesize(input)).audio).toEqual(new Uint8Array([73, 68, 51, 1]));
		for (const value of [{ rate: '+1%' }, { pitch: '+1Hz' }, { volume: '+1%' }])
			await expect(client.synthesize(TtsRequestSchema.parse({ text: 'test', ...value }))).rejects.toThrow('Invalid OpenAI TTS input');
		expect(fetch).toHaveBeenCalledTimes(1);
		await runtime.close();
	});

	it('validates static configuration and resolves only the injected environment', () => {
		expect(OpenAiTtsServiceOptionsSchema.safeParse({}).success).toBe(true);
		expect(OpenAiTtsServiceOptionsSchema.safeParse({ apiKey: 'one', apiKeyEnv: 'TWO' }).success).toBe(false);
		expect(OpenAiTtsServiceOptionsSchema.safeParse({ maxAudioBytes: TTS_MAX_AUDIO_BYTES + 1 }).success).toBe(false);
		expect(EdgeTtsServiceOptionsSchema.safeParse({ voice: 'zh-CN-XiaoxiaoNeural', timeoutMs: 10, maxAudioBytes: 10 }).success).toBe(true);
		expect(EdgeTtsServiceOptionsSchema.safeParse({ apiKey: 'not-supported' }).success).toBe(false);
		expect(() => resolveOpenAiTtsConnectionOptions({ options: { apiKeyEnv: 'TEST_TTS_KEY' } })).toThrow(/^Invalid OpenAI TTS configuration$/u);
		expect(() => resolveOpenAiTtsConnectionOptions({ options: { apiKey: 'env://bad-name' } })).toThrow(/^Invalid OpenAI TTS configuration$/u);
		expect(TtsRequestSchema.safeParse({ text: 'test', model: 'future-local-model' }).success).toBe(true);
		expect(TtsRequestSchema.safeParse({ text: '你'.repeat(33_334) }).success).toBe(false);
	});

	it('forwards Edge defaults and the socket port without resolving credentials', async () => {
		const client = source();
		const create = vi.spyOn(ttsClients, 'createEdgeTtsClient').mockReturnValue(client);
		try {
			const fetch = vi.fn<typeof globalThis.fetch>();
			const edgeTtsSocketFactory = vi.fn((): never => { throw new Error('must not connect'); });
			const options = { voice: 'zh-CN-XiaoxiaoNeural', timeoutMs: 1234, maxAudioBytes: 4096 };
			const { tts } = await EdgeTtsServiceProvider.create({ name: 'speech', config: { provider: 'edge', readOnly: true, options },
				context: { services: {} }, fetch, edgeTtsSocketFactory });
			expect(create).toHaveBeenCalledExactlyOnceWith({ ...options, fetch, socketFactory: edgeTtsSocketFactory });
			await tts.synthesize({ text: 'test', voice: 'request-voice' });
			expect(client.synthesize).toHaveBeenCalledExactlyOnceWith({ text: 'test', voice: 'request-voice' }, undefined);
			await tts.close();
		} finally { create.mockRestore(); }
	});

	it('executes the public service barrel in a browser VM without Node globals', async () => {
		const result = await build({ entryPoints: [new URL('./index.ts', import.meta.url).pathname], bundle: true, platform: 'browser',
			write: false, format: 'iife', globalName: 'TtsBrowser', logLevel: 'silent' });
		const context = { TextEncoder, TextDecoder, Uint8Array, Blob, btoa, atob, output: '' };
		runInNewContext(`${result.outputFiles[0].text}\noutput = JSON.stringify({
			buffer: typeof Buffer, process: typeof process, require: typeof require,
			bytes: Array.from(TtsBrowser.decodeTtsAudio(TtsBrowser.encodeTtsAudio({ audio: new Uint8Array([0,128,255]), format: 'mp3', mediaType: 'audio/mpeg' })).audio),
			request: TtsBrowser.TtsRequestSchema.safeParse({ text: 'test' }).success,
		});`, context);
		expect(JSON.parse(context.output)).toEqual({ buffer: 'undefined', process: 'undefined', require: 'undefined', bytes: [0, 128, 255], request: true });
	});

	it('round trips binary without Buffer, including the maximum payload', () => {
		expect(encodeTtsAudio(audio)).toEqual(wire);
		expect(decodeTtsAudio(wire)).toEqual(audio);
		const large = { ...audio, audio: new Uint8Array(TTS_MAX_AUDIO_BYTES).fill(255) };
		const encoded = encodeTtsAudio(large);
		expect(encoded.byteLength).toBe(TTS_MAX_AUDIO_BYTES);
		const decoded = decodeTtsAudio(encoded).audio;
		expect(decoded.byteLength).toBe(large.audio.byteLength);
		expect(decoded.every((value, index) => value === large.audio[index])).toBe(true);
	});

	it.each([
		{ ...wire, byteLength: 4 }, { ...wire, audioBase64: '@@@=' }, { ...wire, audioBase64: 'A===' },
		{ ...wire, audioBase64: 'AAF/gP9=' }, { ...wire, mediaType: 'text/html' }, { ...wire, extra: 'bad' },
		{ ...wire, byteLength: TTS_MAX_AUDIO_BYTES + 1 },
	])('rejects malformed wire audio %j', (input) => {
		expect(() => decodeTtsAudio(input)).toThrow('Invalid TTS audio transport');
	});

	it('bounds both encoding and the transport schema', () => {
		expect(() => encodeTtsAudio({ ...audio, audio: new Uint8Array(0) })).toThrow('Invalid TTS audio');
		expect(() => encodeTtsAudio({ ...audio, audio: new Uint8Array(TTS_MAX_AUDIO_BYTES + 1) })).toThrow('Invalid TTS audio');
		expect(TtsAudioWireSchema.safeParse(wire).success).toBe(true);
		expect(TtsAudioWireSchema.safeParse({ ...wire, audioBase64: 'a'.repeat(Math.ceil(TTS_MAX_AUDIO_BYTES / 3) * 4 + 4) }).success).toBe(false);
	});

	it('combines client and invocation cancellation before remote calls', async () => {
		const call = vi.fn(async () => wire);
		const controller = new AbortController();
		const client = await createTtsServiceToolClient({ getSchema: async () => ({ tools: TtsTools }), call }, 'speech', { signal: controller.signal });
		await expect(client.synthesize({ text: 'test' }, { signal: AbortSignal.abort() })).rejects.toThrow();
		controller.abort();
		await expect(client.listVoices()).rejects.toThrow();
		expect(call).not.toHaveBeenCalled();
	});
});
