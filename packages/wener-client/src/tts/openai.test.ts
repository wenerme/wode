import { describe, expect, it, vi } from 'vitest';
import { createOpenAiTtsClient, type OpenAiTtsClientOptions, validateOpenAiTtsRequest } from './openai';
import { TTS_MAX_AUDIO_BYTES, TTS_MEDIA_TYPES, type TtsAudioFormat, type TtsRequest } from './types';

const bytes = new Uint8Array([73, 68, 51, 255, 0, 1]);
type HttpFetch = NonNullable<OpenAiTtsClientOptions['fetch']>;
const response = (type = 'audio/mpeg', body: BodyInit = bytes) => new Response(body, { headers: { 'content-type': type } });

describe('OpenAI TTS binary client', () => {
	it('normalizes the base URL, maps the capability fields and permits request overrides', async () => {
		const fetch = vi.fn<HttpFetch>(async () => response());
		const client = createOpenAiTtsClient({ baseUrl: 'https://speech.example.test/custom///', apiKey: 'test-key',
			model: 'default-model', voice: 'default-voice', headers: { 'x-custom': 'fixture' }, fetch });
		const audio = await client.synthesize({ text: '你好', model: 'speech-model', voice: 'nova', speed: 1.5, instructions: 'Calm.' });
		expect(audio).toEqual({ audio: bytes, format: 'mp3', mediaType: 'audio/mpeg', model: 'speech-model', voice: 'nova' });
		const [url, init] = fetch.mock.calls[0];
		expect(url).toBe('https://speech.example.test/custom/audio/speech');
		expect(init).toMatchObject({ method: 'POST', redirect: 'error' });
		expect(new Headers(init?.headers).get('authorization')).toBe('Bearer test-key');
		expect(new Headers(init?.headers).get('x-custom')).toBe('fixture');
		expect(JSON.parse(init?.body as string)).toEqual({ input: '你好', model: 'speech-model', voice: 'nova', response_format: 'mp3', speed: 1.5, instructions: 'Calm.' });
		await client.close();
	});

	it.each(Object.keys(TTS_MEDIA_TYPES) as TtsAudioFormat[])('returns matching binary metadata for %s without requiring a key', async (format) => {
		const fetch = vi.fn<HttpFetch>(async () => response(TTS_MEDIA_TYPES[format]));
		const client = createOpenAiTtsClient({ fetch, model: 'local-speech' });
		const result = await client.synthesize({ text: 'test', format });
		expect(result).toMatchObject({ audio: bytes, format, mediaType: TTS_MEDIA_TYPES[format], voice: 'alloy' });
		expect(new Headers(fetch.mock.calls[0][1]?.headers).has('authorization')).toBe(false);
		await client.close();
	});

	it.each([60, 91, 123])('accepts PCM with first sample byte %s without text sniffing', async (firstByte) => {
		const pcm = new Uint8Array([firstByte, 0, 0, 0]);
		const fetch = vi.fn<HttpFetch>(async () => response('audio/pcm', pcm));
		const client = createOpenAiTtsClient({ fetch, model: 'explicit-model' });
		expect(await client.synthesize({ text: 'test', format: 'pcm' })).toMatchObject({
			audio: pcm,
			format: 'pcm',
			mediaType: 'audio/pcm',
		});
		await client.close();
	});

	it.each(['application/json', 'text/html'])('still rejects %s MIME for PCM responses', async (mediaType) => {
		const fetch = vi.fn<HttpFetch>(async () => response(mediaType, '{"secret":"upstream-body"}'));
		const client = createOpenAiTtsClient({ fetch, model: 'explicit-model' });
		await expect(client.synthesize({ text: 'test', format: 'pcm' })).rejects.toThrow(/^OpenAI TTS request failed$/u);
		expect(fetch).toHaveBeenCalledTimes(1);
		await client.close();
	});

	it('has the documented endpoint default and no invented voices endpoint', async () => {
		const fetch = vi.fn<HttpFetch>(async () => response());
		const client = createOpenAiTtsClient({ fetch, model: 'explicit-model' });
		expect(await client.listVoices()).toEqual({ supported: false, voices: [] });
		expect(fetch).not.toHaveBeenCalled();
		await client.synthesize({ text: 'test' });
		expect(fetch.mock.calls[0][0]).toBe('https://api.openai.com/v1/audio/speech');
		await client.close();
	});

	it.each([
		{ text: 'test', rate: '+5%' }, { text: 'test', pitch: '+1Hz' }, { text: 'test', volume: '+1%' },
		{ text: 'test', speed: 0.24 }, { text: 'test', speed: 4.01 }, { text: 'test', speed: NaN },
		{ text: '' }, { text: '你'.repeat(33_334) }, { text: 'test', unexpected: true },
	])('rejects unsupported or invalid fields before HTTP: %j', async (input) => {
		const fetch = vi.fn<HttpFetch>();
		const client = createOpenAiTtsClient({ fetch, model: 'explicit-model' });
		await expect(client.synthesize(input as TtsRequest)).rejects.toThrow('Invalid OpenAI TTS input');
		expect(fetch).not.toHaveBeenCalled();
		await client.close();
	});

	it('rejects a missing model before HTTP and accepts both speed boundaries', async () => {
		const fetch = vi.fn<HttpFetch>(async () => response());
		const client = createOpenAiTtsClient({ fetch });
		await expect(client.synthesize({ text: 'test' })).rejects.toThrow('model is required');
		expect(fetch).not.toHaveBeenCalled();
		for (const speed of [0.25, 4]) await client.synthesize({ text: 'test', model: 'explicit-model', speed });
		await client.close();
	});

	it('permits explicit undefined prosody fields while rejecting defined values', async () => {
		const fetch = vi.fn<HttpFetch>(async () => response());
		const client = createOpenAiTtsClient({ model: 'model', fetch });
		await expect(client.synthesize({ text: 'test', rate: undefined, pitch: undefined, volume: undefined })).resolves.toMatchObject({ audio: bytes });
		for (const input of [{ rate: '+1%' }, { pitch: '+1Hz' }, { volume: '+1%' }])
			await expect(client.synthesize({ text: 'test', ...input })).rejects.toThrow('Invalid OpenAI TTS input');
		expect(fetch).toHaveBeenCalledTimes(1);
		await client.close();
	});

	it.each([
		['application/json', '{"token":"secret"}'], ['text/html', '<html>secret</html>'],
		['audio/wav', bytes], ['audio/mpeg', '  {"error":"secret"}'], ['audio/mpeg', '<!doctype html>'],
		['audio/mpeg', '[{"error":true}]'], ['audio/mpeg', ''], ['audio/mpeg', `${' '.repeat(1024)}{"error":true}`],
	])('rejects mismatched or fake audio %s', async (type, body) => {
		const fetch = vi.fn<HttpFetch>(async () => response(type as string, body));
		const client = createOpenAiTtsClient({ fetch, model: 'explicit-model' });
		await expect(client.synthesize({ text: 'test' })).rejects.toThrow(/^OpenAI TTS request failed$/u);
		expect(fetch).toHaveBeenCalledTimes(1);
		await client.close();
	});

	it.each([302, 401, 429, 500])('does not replay HTTP %s or expose error bodies', async (status) => {
		const fetch = vi.fn<HttpFetch>(async () => new Response('private-token https://private.test', { status, headers: { location: 'https://private.test' } }));
		const client = createOpenAiTtsClient({ fetch, model: 'explicit-model' });
		await expect(client.synthesize({ text: 'test' })).rejects.toThrow(/^OpenAI TTS request failed$/u);
		expect(fetch).toHaveBeenCalledTimes(1);
		await client.close();
	});

	it('bounds chunked audio and cancels the reader on overflow', async () => {
		const cancel = vi.fn();
		const stream = new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.enqueue(bytes); }, cancel });
		const client = createOpenAiTtsClient({ model: 'model', maxAudioBytes: bytes.length, fetch: async () => response('audio/mpeg', stream) });
		await expect(client.synthesize({ text: 'test' })).rejects.toThrow('OpenAI TTS request failed');
		expect(cancel).toHaveBeenCalledTimes(1);
		await client.close();
	});

	it('rejects oversized Content-Length without reading the stream', async () => {
		const cancel = vi.fn();
		const stream = new ReadableStream<Uint8Array>({ cancel });
		const client = createOpenAiTtsClient({ model: 'model', fetch: async () => new Response(stream, { headers: {
			'content-type': 'audio/mpeg', 'content-length': String(TTS_MAX_AUDIO_BYTES + 1),
		} }) });
		await expect(client.synthesize({ text: 'test' })).rejects.toThrow('OpenAI TTS request failed');
		expect(cancel).toHaveBeenCalledTimes(1);
		await client.close();
	});

	it.each(['abort', 'close', 'timeout'])('settles %s even when fetch ignores AbortSignal', async (kind) => {
		let signal: AbortSignal | null | undefined;
		const fetch = vi.fn<HttpFetch>((_url, init) => { signal = init?.signal; return new Promise(() => {}); });
		const client = createOpenAiTtsClient({ fetch, model: 'model', timeoutMs: kind === 'timeout' ? 5 : 1000 });
		const controller = new AbortController();
		const pending = client.synthesize({ text: 'test' }, { signal: controller.signal });
		const assertion = expect(pending).rejects.toThrow(kind === 'timeout' ? 'TTS request timed out' : 'TTS request aborted');
		if (kind === 'abort') controller.abort(new Error('private-secret'));
		if (kind === 'close') await client.close();
		await assertion;
		expect(signal?.aborted).toBe(true);
		await client.close();
	});

	it('cancels a stalled body and releases it on abort', async () => {
		const cancel = vi.fn();
		const started = Promise.withResolvers<void>();
		const stream = new ReadableStream<Uint8Array>({ pull() { started.resolve(); }, cancel });
		const client = createOpenAiTtsClient({ model: 'model', fetch: async () => response('audio/mpeg', stream) });
		const controller = new AbortController();
		const pending = client.synthesize({ text: 'test' }, { signal: controller.signal });
		const assertion = expect(pending).rejects.toThrow('TTS request aborted');
		await started.promise;
		controller.abort();
		await assertion;
		expect(cancel).toHaveBeenCalledTimes(1);
		await client.close();
	});

	it('rejects pre-abort and all calls after close without fetching', async () => {
		const fetch = vi.fn<HttpFetch>();
		const client = createOpenAiTtsClient({ model: 'model', fetch });
		await expect(client.synthesize({ text: 'test' }, { signal: AbortSignal.abort('private') })).rejects.toThrow('TTS request aborted');
		await client.close();
		await expect(client.synthesize({ text: 'test' })).rejects.toThrow('TTS client is closed');
		await expect(client.listVoices()).rejects.toThrow('TTS client is closed');
		expect(fetch).not.toHaveBeenCalled();
	});

	it('sanitizes transport and invalid URL errors', async () => {
		expect(() => createOpenAiTtsClient({ baseUrl: 'https://secret:token@private.test' })).toThrow(/^Invalid OpenAI TTS configuration$/u);
		const client = createOpenAiTtsClient({ model: 'model', fetch: async () => { throw new Error('token https://private.test'); } });
		await expect(client.synthesize({ text: 'test' })).rejects.toThrow(/^OpenAI TTS request failed$/u);
		await client.close();
	});

	it('rejects an injected fetch that followed a redirect', async () => {
		const redirected = response();
		Object.defineProperty(redirected, 'redirected', { value: true });
		const fetch = vi.fn<HttpFetch>(async () => redirected);
		const client = createOpenAiTtsClient({ model: 'model', fetch });
		await expect(client.synthesize({ text: 'test' })).rejects.toThrow('OpenAI TTS request failed');
		expect(fetch).toHaveBeenCalledTimes(1);
		await client.close();
	});

	it('cancels a late response body after a fetch that ignored abort', async () => {
		const pendingResponse = Promise.withResolvers<Response>();
		const cancel = vi.fn();
		const client = createOpenAiTtsClient({ model: 'model', fetch: () => pendingResponse.promise });
		const pending = client.synthesize({ text: 'test' });
		const assertion = expect(pending).rejects.toThrow('TTS request aborted');
		await client.close();
		await assertion;
		pendingResponse.resolve(response('audio/mpeg', new ReadableStream({ cancel })));
		await Promise.resolve();
		expect(cancel).toHaveBeenCalledTimes(1);
	});
});

describe('pure OpenAI TTS request validation', () => {
	it('normalizes defaults, permits request overrides and never invokes fetch', () => {
		const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(() => { throw new Error('must not fetch'); });
		try {
			expect(validateOpenAiTtsRequest({ text: 'test' }, { model: ' configured-model ', voice: ' configured-voice ' }))
				.toEqual({ text: 'test', model: 'configured-model', voice: 'configured-voice' });
			expect(validateOpenAiTtsRequest({ text: 'test', model: 'request-model', voice: 'nova', speed: 0.25 }, { model: 'default-model', voice: 'default-voice' }))
				.toMatchObject({ model: 'request-model', voice: 'nova', speed: 0.25 });
			expect(validateOpenAiTtsRequest({ text: 'test', model: 'request-model', speed: 4 })).toMatchObject({ voice: 'alloy', speed: 4 });
			expect(fetch).not.toHaveBeenCalled();
		} finally { fetch.mockRestore(); }
	});

	it('accepts own undefined prosody properties and leaves the input unchanged', () => {
		const input = Object.freeze({ text: 'test', rate: undefined, pitch: undefined, volume: undefined });
		expect(validateOpenAiTtsRequest(input, { model: 'model' })).toMatchObject({ model: 'model', voice: 'alloy' });
		expect(input).toEqual({ text: 'test', rate: undefined, pitch: undefined, volume: undefined });
	});

	it.each([
		{ text: 'test', rate: '+1%' }, { text: 'test', pitch: '+1Hz' }, { text: 'test', volume: '+1%' },
		{ text: 'test', speed: 0.24 }, { text: 'test', speed: 4.01 }, { text: '' },
	])('returns fixed input errors for %j', (input) => {
		expect(() => validateOpenAiTtsRequest(input, { model: 'model' })).toThrow(/^Invalid OpenAI TTS input$/u);
	});

	it('reports missing models and invalid defaults with fixed messages', () => {
		expect(() => validateOpenAiTtsRequest({ text: 'test' })).toThrow(/^OpenAI TTS model is required$/u);
		expect(() => validateOpenAiTtsRequest({ text: 'test' }, { model: '', voice: 'private-value' }))
			.toThrow(/^Invalid OpenAI TTS configuration$/u);
	});
});
