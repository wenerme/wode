import { z } from 'zod';
import { OpenAIAudioSpeechRequestSchema } from '../api/openai-audio-speech/schema/OpenAIAudioSpeechSchema';
import {
	TTS_MAX_AUDIO_BYTES,
	TTS_MAX_TEXT_BYTES,
	TTS_MEDIA_TYPES,
	type TtsAudioFormat,
	type TtsClient,
	type TtsRequest,
} from './types';

export interface OpenAiTtsClientOptions {
	baseUrl?: string;
	apiKey?: string;
	headers?: HeadersInit;
	model?: string;
	voice?: string;
	timeoutMs?: number;
	maxAudioBytes?: number;
	fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const requestSchema = z.strictObject({
	text: z
		.string()
		.min(1)
		.max(TTS_MAX_TEXT_BYTES)
		.refine((v) => new TextEncoder().encode(v).length <= TTS_MAX_TEXT_BYTES),
	voice: z.string().trim().min(1).max(256).optional(),
	model: z.string().trim().min(1).max(256).optional(),
	format: z.enum(['mp3', 'wav', 'opus', 'aac', 'flac', 'pcm']).optional(),
	speed: z.number().finite().min(0.25).max(4).optional(),
	rate: z.undefined().optional(),
	pitch: z.undefined().optional(),
	volume: z.undefined().optional(),
	instructions: z.string().max(TTS_MAX_TEXT_BYTES).optional(),
});

const defaultsSchema = z.object({ model: requestSchema.shape.model, voice: requestSchema.shape.voice });

function toSpeechRequest(input: TtsRequest & { model: string; voice: string }) {
	return {
		input: input.text,
		model: input.model,
		voice: input.voice,
		response_format: input.format ?? 'mp3',
		speed: input.speed,
		instructions: input.instructions,
	};
}

/** Validate and normalize without creating a client, resolving credentials or performing I/O. */
export function validateOpenAiTtsRequest(
	input: TtsRequest,
	defaults: { model?: string; voice?: string } = {},
): TtsRequest & { model: string; voice: string } {
	const parsed = requestSchema.safeParse(input);
	if (!parsed.success) throw new TypeError('Invalid OpenAI TTS input');
	const parsedDefaults = defaultsSchema.safeParse(defaults);
	if (!parsedDefaults.success) throw new TypeError('Invalid OpenAI TTS configuration');
	const model = parsed.data.model ?? parsedDefaults.data.model;
	if (!model) throw new TypeError('OpenAI TTS model is required');
	const voice = parsed.data.voice ?? parsedDefaults.data.voice ?? 'alloy';
	const request = { ...parsed.data, model, voice };
	if (!OpenAIAudioSpeechRequestSchema.safeParse(toSpeechRequest(request)).success)
		throw new TypeError('Invalid OpenAI TTS input');
	return request;
}

const mediaTypes: Record<TtsAudioFormat, readonly string[]> = {
	mp3: ['audio/mpeg', 'audio/mp3'],
	wav: ['audio/wav', 'audio/wave', 'audio/x-wav'],
	opus: ['audio/ogg', 'audio/opus'],
	aac: ['audio/aac'],
	flac: ['audio/flac', 'audio/x-flac'],
	pcm: ['audio/pcm'],
};

/** One POST per synthesis. A redirect can never replay credentials or text. */
export function createOpenAiTtsClient(options: OpenAiTtsClientOptions): TtsClient {
	let url: string;
	let headers: Headers;
	let timeoutMs: number;
	let maxAudioBytes: number;
	let defaultModel: string | undefined;
	let defaultVoice: string;
	let fetcher: NonNullable<OpenAiTtsClientOptions['fetch']>;
	try {
		const base = new URL(options.baseUrl ?? 'https://api.openai.com/v1');
		if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.search || base.hash)
			throw new Error();
		base.pathname = `${base.pathname.replace(/\/+$/u, '')}/audio/speech`;
		url = base.href;
		timeoutMs = options.timeoutMs ?? 30_000;
		maxAudioBytes = options.maxAudioBytes ?? TTS_MAX_AUDIO_BYTES;
		if (
			!Number.isSafeInteger(timeoutMs) ||
			timeoutMs < 1 ||
			timeoutMs > 2_147_483_647 ||
			!Number.isSafeInteger(maxAudioBytes) ||
			maxAudioBytes < 1 ||
			maxAudioBytes > TTS_MAX_AUDIO_BYTES
		)
			throw new Error();
		const defaults = defaultsSchema.safeParse({ model: options.model, voice: options.voice });
		if (!defaults.success) throw new Error();
		defaultModel = defaults.data.model;
		defaultVoice = defaults.data.voice ?? 'alloy';
		headers = new Headers(options.headers);
		if (options.apiKey !== undefined) {
			if (!options.apiKey.trim() || /[\r\n]/u.test(options.apiKey)) throw new Error();
			headers.set('authorization', `Bearer ${options.apiKey}`);
		}
		headers.set('content-type', 'application/json');
		headers.set('accept', 'audio/*');
		fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
		if (typeof fetcher !== 'function') throw new Error();
	} catch {
		throw new TypeError('Invalid OpenAI TTS configuration');
	}
	let closed = false;
	const active = new Set<AbortController>();
	return {
		async synthesize(input: TtsRequest, callOptions = {}) {
			if (closed) throw new Error('TTS client is closed');
			if (callOptions.signal?.aborted) throw new DOMException('TTS request aborted', 'AbortError');
			const request = validateOpenAiTtsRequest(input, { model: defaultModel, voice: defaultVoice });
			const { model, voice } = request;
			const format = request.format ?? 'mp3';
			const payload = toSpeechRequest(request);
			const controller = new AbortController();
			active.add(controller);
			let timedOut = false;
			let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
			let complete = false;
			const cancel = () => controller.abort();
			callOptions.signal?.addEventListener('abort', cancel, { once: true });
			const timer = setTimeout(() => {
				timedOut = true;
				controller.abort();
			}, timeoutMs);
			let rejectAbort: () => void = () => {};
			const aborted = new Promise<never>((_, reject) => {
				rejectAbort = () => reject(new Error('TTS request aborted'));
				controller.signal.addEventListener('abort', rejectAbort, { once: true });
			});
			if (callOptions.signal?.aborted) cancel();
			try {
				const pending = fetcher(url, {
					method: 'POST',
					headers: new Headers(headers),
					body: JSON.stringify(payload),
					redirect: 'error',
					signal: controller.signal,
				}).then((response) => {
					if (controller.signal.aborted) void response.body?.cancel().catch(() => {});
					return response;
				});
				const response = await Promise.race([pending, aborted]);
				// Reject even a non-conforming injected fetch that follows redirects.
				if (response.redirected || !response.ok) {
					void response.body?.cancel().catch(() => {});
					throw new Error();
				}
				reader = response.body?.getReader();
				const mediaType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
				if (!mediaType || !mediaTypes[format].includes(mediaType) || !reader) throw new Error();
				const length = response.headers.get('content-length');
				if (length !== null && (!/^\d+$/u.test(length) || Number(length) > maxAudioBytes)) throw new Error();
				const buffer = new Uint8Array(maxAudioBytes);
				let size = 0;
				while (true) {
					const { value, done } = await Promise.race([reader.read(), aborted]);
					if (done) break;
					if (value.byteLength > maxAudioBytes - size) throw new Error();
					buffer.set(value, size);
					size += value.byteLength;
				}
				if (!size || controller.signal.aborted) throw new Error();
				const audio = buffer.slice(0, size);
				if (format !== 'pcm') {
					let offset = audio[0] === 0xef && audio[1] === 0xbb && audio[2] === 0xbf ? 3 : 0;
					while (offset < size && [9, 10, 13, 32].includes(audio[offset])) offset++;
					const prefix = new TextDecoder().decode(audio.subarray(offset, offset + 512)).trimStart();
					if (/^[{[<]/u.test(prefix)) throw new Error();
				}
				complete = true;
				return { audio, format, mediaType: TTS_MEDIA_TYPES[format], voice, model };
			} catch {
				if (timedOut) throw new Error('TTS request timed out');
				if (controller.signal.aborted) throw new DOMException('TTS request aborted', 'AbortError');
				throw new Error('OpenAI TTS request failed');
			} finally {
				clearTimeout(timer);
				callOptions.signal?.removeEventListener('abort', cancel);
				controller.signal.removeEventListener('abort', rejectAbort);
				active.delete(controller);
				if (!complete) {
					controller.abort();
					void reader?.cancel().catch(() => {});
				}
			}
		},
		async listVoices(_input, callOptions = {}) {
			if (closed) throw new Error('TTS client is closed');
			if (callOptions.signal?.aborted) throw new DOMException('TTS request aborted', 'AbortError');
			return { supported: false, voices: [] };
		},
		async close() {
			closed = true;
			for (const controller of active) controller.abort();
		},
	};
}
