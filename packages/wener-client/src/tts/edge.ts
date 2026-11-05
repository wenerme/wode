import { EDGE_BASE, EDGE_CODEC, EDGE_GEC_VERSION, EDGE_TOKEN, edgeHeaders, edgeId, edgeSignature, edgeTextChunks, escapeXml, parseEdgeFrame } from './edge-protocol';
import { TTS_MAX_AUDIO_BYTES, TTS_MAX_TEXT_BYTES, type EdgeTtsSocket, type EdgeTtsSocketFactory, type TtsCallOptions, type TtsClient, type TtsRequest, type TtsVoice } from './types';

export interface EdgeTtsClientOptions {
	socketFactory?: EdgeTtsSocketFactory;
	fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
	voice?: string;
	timeoutMs?: number;
	maxAudioBytes?: number;
}

class EdgeError extends Error {}
class HandshakeError extends EdgeError {
	readonly status?: number;
	readonly date?: string;
	constructor(status?: number, date?: string) {
		super('Edge TTS connection failed');
		this.status = Number.isInteger(status) && status! >= 100 && status! <= 599 ? status : undefined;
		this.date = typeof date === 'string' && date.length <= 128 && Number.isFinite(Date.parse(date))
			? new Date(Date.parse(date)).toUTCString() : undefined;
	}
}

function fail(message: string): never { throw new EdgeError(message); }
function check(signal: AbortSignal): void { if (signal.aborted) throw signal.reason; }

function wait<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
	check(signal);
	return new Promise((resolve, reject) => {
		const abort = () => reject(signal.reason);
		signal.addEventListener('abort', abort, { once: true });
		promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
	});
}

export function validateEdgeTtsRequest(input: TtsRequest, fallback = 'zh-CN-XiaoxiaoNeural') {
	if (!input || typeof input.text !== 'string' || !input.text.trim()) fail('Edge TTS text must not be empty');
	if (new TextEncoder().encode(input.text).length > TTS_MAX_TEXT_BYTES) fail('Edge TTS text exceeds 100000 bytes');
	if (input.format !== undefined && input.format !== 'mp3') fail('Edge TTS supports only mp3');
	if (input.model !== undefined) fail('Edge TTS does not support model');
	if (input.instructions !== undefined) fail('Edge TTS does not support instructions');
	if (input.speed !== undefined && input.rate !== undefined) fail('Edge TTS speed and rate are mutually exclusive');
	let rate = input.rate ?? '+0%';
	if (input.speed !== undefined) {
		if (!Number.isFinite(input.speed) || input.speed <= 0) fail('Edge TTS speed must be a positive finite number');
		const value = Math.round((input.speed - 1) * 100);
		rate = `${value >= 0 ? '+' : ''}${value}%`;
	}
	const pitch = input.pitch ?? '+0Hz';
	const volume = input.volume ?? '+0%';
	for (const [name, value, pattern] of [['rate', rate, /^[+-]\d+%$/], ['pitch', pitch, /^[+-]\d+Hz$/], ['volume', volume, /^[+-]\d+%$/]] as const) {
		if (typeof value !== 'string' || !pattern.test(value) || !Number.isSafeInteger(Number.parseInt(value, 10))) fail(`Edge TTS ${name} is invalid`);
	}
	if (Number.parseInt(rate, 10) <= -100) fail('Edge TTS rate must exceed -100%');
	if (Number.parseInt(volume, 10) < -100) fail('Edge TTS volume must be at least -100%');
	const voice = input.voice ?? fallback;
	if (typeof voice !== 'string' || !voice || voice.length > 256 || /[\x00-\x1f\x7f]/.test(voice)) fail('Edge TTS voice is invalid');
	return { rate, pitch, volume, voice };
}

export function createEdgeTtsClient(options: EdgeTtsClientOptions = {}): TtsClient {
	const timeoutMs = options.timeoutMs ?? 60_000;
	const maxAudioBytes = options.maxAudioBytes ?? TTS_MAX_AUDIO_BYTES;
	if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2147483647) fail('Edge TTS timeoutMs is invalid');
	if (!Number.isInteger(maxAudioBytes) || maxAudioBytes <= 0 || maxAudioBytes > TTS_MAX_AUDIO_BYTES) fail('Edge TTS maxAudioBytes is invalid');
	let closed = false;
	let clockOffset = 0;
	const active = new Map<AbortController, Promise<unknown>>();
	const signature = () => edgeSignature(Date.now() + clockOffset);
	function adjust(date?: string): boolean {
		if (!date || date.length > 128) return false;
		const time = Date.parse(date);
		if (!Number.isFinite(time)) return false;
		clockOffset = time - Date.now();
		return true;
	}
	function run<T>(call: TtsCallOptions | undefined, task: (signal: AbortSignal) => Promise<T>): Promise<T> {
		if (closed) return Promise.reject(new EdgeError('Edge TTS client is closed'));
		const controller = new AbortController();
		const abort = () => controller.abort(new DOMException('Edge TTS request aborted', 'AbortError'));
		if (call?.signal?.aborted) abort();
		else call?.signal?.addEventListener('abort', abort, { once: true });
		const timer = setTimeout(() => controller.abort(new EdgeError('Edge TTS request timed out')), timeoutMs);
		const result = Promise.resolve().then(() => {
			check(controller.signal);
			return task(controller.signal);
		}).catch((error: unknown) => {
			if (controller.signal.aborted) throw controller.signal.reason;
			if (error instanceof EdgeError) throw error;
			throw new EdgeError('Edge TTS request failed');
		}).finally(() => {
			clearTimeout(timer);
			call?.signal?.removeEventListener('abort', abort);
			active.delete(controller);
		});
		active.set(controller, result);
		return result;
	}

	async function synthesizeChunk(text: string, config: ReturnType<typeof validateEdgeTtsRequest>, signal: AbortSignal, receive: (data: Uint8Array) => void): Promise<void> {
		const gec = await wait(signature(), signal);
		check(signal);
		let socket: EdgeTtsSocket;
		try {
			socket = options.socketFactory!(`wss://${EDGE_BASE}/edge/v1?TrustedClientToken=${EDGE_TOKEN}&ConnectionId=${edgeId()}&Sec-MS-GEC=${gec}&Sec-MS-GEC-Version=${EDGE_GEC_VERSION}`, { headers: edgeHeaders() });
		} catch { throw new EdgeError('Edge TTS connection failed'); }
		const unsubscribe: Array<() => void> = [];
		try {
			await new Promise<void>((resolve, reject) => {
				let settled = false;
				let opened = false;
				let audioBytes = 0;
				const finish = (error?: unknown) => {
					if (settled) return;
					settled = true;
					if (error) reject(error); else resolve();
				};
				const onAbort = () => finish(signal.reason);
				signal.addEventListener('abort', onAbort, { once: true });
				unsubscribe.push(() => signal.removeEventListener('abort', onAbort));
				unsubscribe.push(socket.onError((e) => finish(!opened ? new HandshakeError(e?.status, e?.date) : new EdgeError('Edge TTS connection failed'))));
				unsubscribe.push(socket.onClose(() => finish(new EdgeError('Edge TTS connection closed before turn.end'))));
				unsubscribe.push(socket.onMessage((data) => {
					if (settled) return;
					try {
						if (!opened) fail('Edge TTS received a frame before connection opened');
						let frame: ReturnType<typeof parseEdgeFrame>;
						try { frame = parseEdgeFrame(data); } catch { fail('Edge TTS received a malformed frame'); }
						if (frame.audio !== undefined) {
							if (frame.audio.length) { receive(frame.audio); audioBytes += frame.audio.length; }
						} else if (frame.path === 'turn.end') {
							if (!audioBytes) fail('Edge TTS returned no audio');
							finish();
						} else if (!['turn.start', 'response', 'audio.metadata'].includes(frame.path)) fail('Edge TTS received an unexpected frame');
					} catch (error) { finish(error); }
				}));
				const open = () => {
					if (settled || opened) return;
					opened = true;
					try {
						check(signal);
						const timestamp = new Date(Date.now() + clockOffset).toUTCString();
						socket.send(`X-Timestamp:${timestamp}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${JSON.stringify({ context: { synthesis: { audio: { metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' }, outputFormat: EDGE_CODEC } } } })}\r\n`);
						const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="${escapeXml(config.voice)}"><prosody rate="${config.rate}" pitch="${config.pitch}" volume="${config.volume}">${text}</prosody></voice></speak>`;
						socket.send(`X-RequestId:${edgeId()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${timestamp}Z\r\nPath:ssml\r\n\r\n${ssml}`);
					} catch { finish(new EdgeError('Edge TTS send failed')); }
				};
				unsubscribe.push(socket.onOpen(open));
				if (signal.aborted) onAbort();
				else if (socket.readyState === 1) open();
				else if (socket.readyState > 1) finish(new EdgeError('Edge TTS connection failed'));
			});
		} finally {
			for (const off of unsubscribe) off();
			try { await socket.close(); } catch { /* Transport errors must not disclose the request URL/text. */ }
		}
	}

	return {
		synthesize(input, call) {
			return run(call, async (signal) => {
				const config = validateEdgeTtsRequest(input, options.voice);
				if (!options.socketFactory) fail('Edge TTS synthesis requires a socketFactory; Node hosts can use createNodeEdgeTtsSocketFactory');
				const chunks: Uint8Array[] = [];
				let total = 0;
				let retried = false;
				const receive = (data: Uint8Array) => {
					if (data.byteLength > maxAudioBytes - total) fail('Edge TTS audio exceeds the byte limit');
					total += data.byteLength;
					chunks.push(data.slice());
				};
				for (const text of edgeTextChunks(input.text)) {
					try { await synthesizeChunk(text, config, signal, receive); }
					catch (error) {
						if (!(error instanceof HandshakeError) || error.status !== 403 || retried || total !== 0 || !adjust(error.date)) throw error;
						retried = true;
						await synthesizeChunk(text, config, signal, receive);
					}
				}
				check(signal);
				if (!total) fail('Edge TTS returned no audio');
				const audio = new Uint8Array(total);
				let offset = 0;
				for (const chunk of chunks) { audio.set(chunk, offset); offset += chunk.length; }
				return { audio, format: 'mp3', mediaType: 'audio/mpeg', voice: config.voice };
			});
		},
		listVoices(input = {}, call) {
			return run(call, async (signal) => {
				if (input.locale !== undefined && typeof input.locale !== 'string') fail('Edge TTS locale is invalid');
				if (input.query !== undefined && typeof input.query !== 'string') fail('Edge TTS query is invalid');
				const fetcher = options.fetch ?? globalThis.fetch;
				if (!fetcher) fail('Edge TTS voice listing requires fetch');
				for (let attempt = 0; ; attempt++) {
					const gec = await wait(signature(), signal);
					check(signal);
					const response = await wait(fetcher(`https://${EDGE_BASE}/voices/list?trustedclienttoken=${EDGE_TOKEN}&Sec-MS-GEC=${gec}&Sec-MS-GEC-Version=${EDGE_GEC_VERSION}`, { headers: edgeHeaders(), signal }), signal);
					if (!response.ok) {
						await wait(response.body?.cancel().catch(() => {}) ?? Promise.resolve(), signal);
						if (attempt === 0 && response.status === 403 && adjust(response.headers.get('date') ?? undefined)) continue;
						fail('Edge TTS voice listing failed');
					}
					const data: unknown = await wait(response.json(), signal);
					if (!Array.isArray(data)) fail('Edge TTS received an invalid voice list');
					const voices: TtsVoice[] = data.map((item) => {
						if (!item || typeof item.ShortName !== 'string' || typeof item.Locale !== 'string' || typeof item.FriendlyName !== 'string' || typeof item.Gender !== 'string') fail('Edge TTS received an invalid voice list');
						return { id: item.ShortName, name: item.FriendlyName, locale: item.Locale, gender: item.Gender };
					}).filter((v) => (!input.locale || v.locale!.toLowerCase() === input.locale.toLowerCase()) && (!input.query || [v.id, v.name, v.locale, v.gender].join(' ').toLowerCase().includes(input.query.toLowerCase())));
					return { supported: true, voices };
				}
			});
		},
		async close() {
			closed = true;
			const pending = [...active];
			for (const [controller] of pending) controller.abort(new EdgeError('Edge TTS client is closed'));
			await Promise.allSettled(pending.map(([, promise]) => promise));
		},
	};
}
