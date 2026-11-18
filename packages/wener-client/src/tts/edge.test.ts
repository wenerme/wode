import { describe, expect, it, vi } from 'vitest';
import { createEdgeTtsClient, type EdgeTtsClientOptions } from './edge';
import { edgeSignature, edgeTextChunks } from './edge-protocol';
import type { EdgeTtsSocket, EdgeTtsSocketFactory, TtsRequest } from './types';

const encoder = new TextEncoder();
const end = 'Path:turn.end\r\n\r\n';
function audio(data: number[], extra = 'Content-Type:audio/mpeg\r\n', path = 'audio') {
	const headers = encoder.encode(`${extra}Path:${path}\r\n`);
	const frame = new Uint8Array(2 + headers.length + data.length);
	new DataView(frame.buffer).setUint16(0, headers.length, false);
	frame.set(headers, 2);
	frame.set(data, 2 + headers.length);
	return frame;
}

class Socket implements EdgeTtsSocket {
	readyState = 0;
	sent: string[] = [];
	closed = 0;
	openListeners = new Set<() => void>();
	messageListeners = new Set<(data: string | Uint8Array) => void>();
	errorListeners = new Set<(error?: { status?: number; date?: string }) => void>();
	closeListeners = new Set<() => void>();
	onSend?: (value: string) => void;
	closeWait?: Promise<void>;
	send(data: string) { this.sent.push(data); this.onSend?.(data); }
	async close() { this.closed++; this.readyState = 3; await this.closeWait; for (const fn of this.closeListeners) fn(); }
	onOpen(fn: () => void) { this.openListeners.add(fn); return () => { this.openListeners.delete(fn); }; }
	onMessage(fn: (data: string | Uint8Array) => void) { this.messageListeners.add(fn); return () => { this.messageListeners.delete(fn); }; }
	onError(fn: (error?: { status?: number; date?: string }) => void) { this.errorListeners.add(fn); return () => { this.errorListeners.delete(fn); }; }
	onClose(fn: () => void) { this.closeListeners.add(fn); return () => { this.closeListeners.delete(fn); }; }
	open() { this.readyState = 1; for (const fn of this.openListeners) fn(); }
	message(data: string | Uint8Array) { for (const fn of this.messageListeners) fn(data); }
	error(error?: { status?: number; date?: string }) { for (const fn of this.errorListeners) fn(error); }
	remoteClose() { this.readyState = 3; for (const fn of this.closeListeners) fn(); }
}

function transport(behavior: (socket: Socket, index: number) => void = (s) => { s.message(audio([1, 2])); s.message(end); }) {
	const sockets: Socket[] = [];
	const factory = vi.fn<EdgeTtsSocketFactory>((_url, _options) => {
		const s = new Socket();
		const index = sockets.push(s) - 1;
		s.onSend = (value) => { if (value.includes('Path:ssml\r\n')) queueMicrotask(() => behavior(s, index)); };
		queueMicrotask(() => s.open());
		return s;
	});
	return { factory, sockets };
}

describe('Edge TTS protocol and synthesis', () => {
	it('matches independent MIT reference vectors, with five-minute buckets', async () => {
		expect(await edgeSignature(0)).toBe('52BC7A17B50DFEC9-28C4394775C8751CD2F6859C030C06DB1489ACAB3B3A7651831FC26895177ED6');
		expect(await edgeSignature(1793738163000)).toBe('DBBC84799CB63766-8C52337FDCB27FF6574D2FA7DCB0FFF9902C5FC69763216BEEA7EBB0F6E9CB51');
		expect(await edgeSignature(1793738163000)).toBe(await edgeSignature(1793738164000));
	});

	it('sends config before SSML, joins ordered audio and waits for socket cleanup', async () => {
		let release!: () => void;
		const closeWait = new Promise<void>((resolve) => { release = resolve; });
		const t = transport((s) => {
			s.closeWait = closeWait;
			s.message('Path:turn.start\r\n\r\n{}');
			s.message(audio([1, 2]));
			s.message('Path:audio.metadata\r\n\r\n{}');
			s.message(audio([3, 4]));
			s.message(audio([], ''));
			s.message(end);
			// A late message cannot mutate the completed result.
			s.message(audio([99]));
		});
		const client = createEdgeTtsClient({ socketFactory: t.factory });
		let finished = false;
		const pending = client.synthesize({ text: '你好<&\u000b😀', speed: 1.25 }).then((value) => { finished = true; return value; });
		await vi.waitFor(() => expect(t.sockets[0]?.closed).toBe(1));
		expect(finished).toBe(false);
		release();
		const result = await pending;
		expect([...result.audio]).toEqual([1, 2, 3, 4]);
		expect(result).toMatchObject({ voice: 'zh-CN-XiaoxiaoNeural', format: 'mp3', mediaType: 'audio/mpeg' });
		expect(t.sockets[0].sent[0]).toContain('Path:speech.config');
		expect(t.sockets[0].sent[0]).toContain('audio-24khz-48kbitrate-mono-mp3');
		expect(t.sockets[0].sent[1]).toContain('rate="+25%"');
		expect(t.sockets[0].sent[1]).toContain('你好&lt;&amp; 😀');
		const url = new URL(t.factory.mock.calls[0][0]);
		expect(url.searchParams.get('Sec-MS-GEC')).toMatch(/^[0-9A-F]{16}-[0-9A-F]{64}$/);
		expect(t.factory.mock.calls[0][1].headers.Cookie).toMatch(/^muid=[A-F0-9]{32};$/);
		expect(t.sockets[0].messageListeners.size).toBe(0);
		await client.close();
	});

	it('splits escaped Unicode safely and synthesizes long text in sequence', async () => {
		const text = '<😀&'.repeat(1200);
		const escaped = edgeTextChunks(text);
		expect(escaped.length).toBeGreaterThan(1);
		for (const part of escaped) {
			expect(encoder.encode(part).length).toBeLessThanOrEqual(4096);
			expect(part).not.toMatch(/&[^;]*$/);
			expect(part).not.toContain('\ufffd');
		}
		expect(escaped.join('')).toBe('&lt;😀&amp;'.repeat(1200));
		const t = transport((s, i) => { s.message(audio([i])); s.message(end); });
		const result = await createEdgeTtsClient({ socketFactory: t.factory }).synthesize({ text });
		expect([...result.audio]).toEqual(escaped.map((_, i) => i));
		expect(t.sockets.every((s) => s.closed === 1)).toBe(true);
	});

	it.each([
		{ format: 'wav' }, { model: '' }, { instructions: '' }, { speed: 1, rate: '+0%' },
		{ rate: 'fast' }, { rate: '-100%' }, { pitch: '+2%' }, { volume: '-101%' },
		{ speed: 0 }, { speed: Number.NaN }, { voice: 'bad\r\nheader' }, { text: ' ' },
		{ text: '😀'.repeat(25001) },
	])('rejects unsupported/invalid input before network: %j', async (extra) => {
		const t = transport();
		await expect(createEdgeTtsClient({ socketFactory: t.factory }).synthesize({ text: 'test', ...extra } as TtsRequest)).rejects.toThrow(/Edge TTS/);
		expect(t.factory).not.toHaveBeenCalled();
	});

	it('leaves voices available without a socket factory', async () => {
		await expect(createEdgeTtsClient().synthesize({ text: 'test' })).rejects.toThrow('socketFactory');
	});

	it.each([
		new Uint8Array([0]), new Uint8Array([0, 10, 1]),
		audio([1], 'Content-Type:audio/wav\r\n'), audio([1], '', 'audio'),
		audio([1], 'Content-Type:audio/mpeg\r\n', 'unknown'), audio([]),
		'Path:turn.end', 'Path:unknown\r\n\r\n', 'Path:turn.end\r\nPath:turn.end\r\n\r\n',
	])('rejects malformed frames and closes transport: %j', async (frame) => {
		const t = transport((s) => s.message(frame));
		await expect(createEdgeTtsClient({ socketFactory: t.factory }).synthesize({ text: 'test' })).rejects.toThrow(/malformed|unexpected/);
		expect(t.sockets[0].closed).toBe(1);
	});

	it('rejects a zero-audio turn and premature close', async () => {
		for (const behavior of [(s: Socket) => s.message(end), (s: Socket) => { s.message(audio([1])); s.remoteClose(); }]) {
			const t = transport(behavior);
			await expect(createEdgeTtsClient({ socketFactory: t.factory }).synthesize({ text: 'test' })).rejects.toThrow(/no audio|before turn.end/);
		}
	});

	it('enforces the total byte limit across frames and text chunks', async () => {
		const t = transport((s) => { s.message(audio([1, 2])); s.message(end); });
		await expect(createEdgeTtsClient({ socketFactory: t.factory, maxAudioBytes: 3 }).synthesize({ text: 'a'.repeat(4100) })).rejects.toThrow('byte limit');
		expect(t.sockets).toHaveLength(2);
		expect(t.sockets.every((s) => s.closed === 1)).toBe(true);
		const one = transport((s) => { s.message(audio([1, 2])); s.message(audio([3, 4])); });
		await expect(createEdgeTtsClient({ socketFactory: one.factory, maxAudioBytes: 3 }).synthesize({ text: 'test' })).rejects.toThrow('byte limit');
	});

	it('times out and closes a stalled connection', async () => {
		const s = new Socket();
		await expect(createEdgeTtsClient({ socketFactory: () => s, timeoutMs: 30 }).synthesize({ text: 'test' })).rejects.toThrow('timed out');
		expect(s.closed).toBe(1);
	});

	it('bounds the whole synthesis call rather than resetting timeout for each frame', async () => {
		const t = transport((s) => {
			const timer = setInterval(() => s.message(audio([1])), 5);
			s.onClose(() => clearInterval(timer));
		});
		await expect(createEdgeTtsClient({ socketFactory: t.factory, timeoutMs: 40 }).synthesize({ text: 'test' })).rejects.toThrow('timed out');
		expect(t.sockets[0].closed).toBe(1);
	});

	it('aborts without exposing the caller reason and removes listeners', async () => {
		const controller = new AbortController();
		const t = transport(() => controller.abort(new Error('PRIVATE KEY')));
		await expect(createEdgeTtsClient({ socketFactory: t.factory }).synthesize({ text: 'test' }, { signal: controller.signal })).rejects.toThrow('Edge TTS request aborted');
		expect(t.sockets[0].closed).toBe(1);
		expect(t.sockets[0].errorListeners.size).toBe(0);
		await expect(createEdgeTtsClient({ socketFactory: t.factory }).synthesize({ text: 'test' }, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
		expect(t.factory).toHaveBeenCalledTimes(1);
	});

	it('close cancels outstanding calls, waits for terminal close, and is idempotent', async () => {
		const s = new Socket();
		let release!: () => void;
		s.closeWait = new Promise<void>((resolve) => { release = resolve; });
		const factory = vi.fn(() => s);
		const client = createEdgeTtsClient({ socketFactory: factory });
		const request = client.synthesize({ text: 'test' });
		const rejected = expect(request).rejects.toThrow('client is closed');
		await vi.waitFor(() => expect(factory).toHaveBeenCalledTimes(1));
		let closed = false;
		const closing = client.close().then(() => { closed = true; });
		await vi.waitFor(() => expect(s.closed).toBe(1));
		expect(closed).toBe(false);
		release();
		await Promise.all([rejected, closing, client.close()]);
		await expect(client.synthesize({ text: 'test' })).rejects.toThrow('client is closed');
	});

	it('retries a 403 handshake once with server Date before sending any text', async () => {
		const urls: string[] = [];
		const sockets: Socket[] = [];
		const factory: EdgeTtsSocketFactory = (url) => {
			urls.push(url);
			const s = new Socket(); sockets.push(s);
			if (sockets.length === 1) queueMicrotask(() => s.error({ status: 403, date: new Date(Date.now() + 600_000).toUTCString() }));
			else {
				s.onSend = (value) => { if (value.includes('Path:ssml')) queueMicrotask(() => { s.message(audio([7])); s.message(end); }); };
				queueMicrotask(() => s.open());
			}
			return s;
		};
		expect([...(await createEdgeTtsClient({ socketFactory: factory }).synthesize({ text: 'test' })).audio]).toEqual([7]);
		expect(sockets[0].sent).toHaveLength(0);
		expect(urls).toHaveLength(2);
		expect(new URL(urls[0]).searchParams.get('Sec-MS-GEC')).not.toEqual(new URL(urls[1]).searchParams.get('Sec-MS-GEC'));
	});

	it('never loops on 403, retries without Date, or regenerates a completed segment', async () => {
		for (const date of [undefined, 'invalid', new Date().toUTCString()]) {
			const factory = vi.fn(() => {
				const s = new Socket(); queueMicrotask(() => s.error({ status: 403, date })); return s;
			});
			await expect(createEdgeTtsClient({ socketFactory: factory }).synthesize({ text: 'test' })).rejects.toThrow('connection failed');
			expect(factory).toHaveBeenCalledTimes(date && date !== 'invalid' ? 2 : 1);
		}
		let index = 0;
		const factory = vi.fn(() => {
			const s = new Socket();
			if (index++ === 0) {
				s.onSend = (value) => { if (value.includes('Path:ssml')) queueMicrotask(() => { s.message(audio([1])); s.message(end); }); };
				queueMicrotask(() => s.open());
			} else queueMicrotask(() => s.error({ status: 403, date: new Date().toUTCString() }));
			return s;
		});
		await expect(createEdgeTtsClient({ socketFactory: factory }).synthesize({ text: 'a'.repeat(4100) })).rejects.toThrow('connection failed');
		expect(factory).toHaveBeenCalledTimes(2);
	});

	it('sanitizes raw transport failures', async () => {
		await expect(createEdgeTtsClient({ socketFactory: () => { throw new Error('PRIVATE URL TOKEN TEXT'); } }).synthesize({ text: 'test' })).rejects.toThrow(/^Edge TTS connection failed$/);
		const t = transport((s) => s.error({ status: 403, date: new Date().toUTCString() }));
		await expect(createEdgeTtsClient({ socketFactory: t.factory }).synthesize({ text: 'test' })).rejects.toThrow(/^Edge TTS connection failed$/);
		expect(t.factory).toHaveBeenCalledTimes(1);
	});
});

describe('Edge voice listing', () => {
	const voices = [
		{ ShortName: 'zh-CN-XiaoxiaoNeural', FriendlyName: 'Xiaoxiao', Locale: 'zh-CN', Gender: 'Female' },
		{ ShortName: 'en-US-AriaNeural', FriendlyName: 'Aria', Locale: 'en-US', Gender: 'Female' },
	];
	it('lists and filters without any socketFactory', async () => {
		const fetcher = vi.fn<NonNullable<EdgeTtsClientOptions['fetch']>>(async () => Response.json(voices));
		const client = createEdgeTtsClient({ fetch: fetcher });
		expect(await client.listVoices({ locale: 'ZH-cn', query: 'xIaO' })).toEqual({ supported: true, voices: [{ id: voices[0].ShortName, name: 'Xiaoxiao', locale: 'zh-CN', gender: 'Female' }] });
		expect(fetcher.mock.calls[0][0]).toContain('/voices/list?');
		expect(fetcher.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
	});
	it('cancels an error body and retries HTTP 403 once using Date', async () => {
		const cancel = vi.fn();
		const fetcher = vi.fn<NonNullable<EdgeTtsClientOptions['fetch']>>()
			.mockResolvedValueOnce(new Response(new ReadableStream({ cancel }), { status: 403, headers: { date: new Date(Date.now() + 600000).toUTCString() } }))
			.mockResolvedValueOnce(Response.json(voices));
		expect((await createEdgeTtsClient({ fetch: fetcher }).listVoices()).voices).toHaveLength(2);
		expect(fetcher).toHaveBeenCalledTimes(2);
		expect(cancel).toHaveBeenCalledTimes(1);
	});
	it('sanitizes HTTP/network/JSON errors and rejects invalid voice payloads', async () => {
		for (const fetcher of [
			async () => new Response('PRIVATE BODY', { status: 500 }),
			async () => { throw new Error('PRIVATE URL'); },
			async () => new Response('PRIVATE INVALID JSON'),
			async () => Response.json({ private: 'PRIVATE BODY' }),
			async () => Response.json([{ ShortName: 'x' }]),
		]) {
			await expect(createEdgeTtsClient({ fetch: fetcher }).listVoices()).rejects.toThrow(/^Edge TTS (voice listing failed|request failed|received an invalid voice list)$/);
		}
	});
	it('times out even when an injected fetch ignores abort', async () => {
		const fetcher = vi.fn<NonNullable<EdgeTtsClientOptions['fetch']>>(() => new Promise(() => {}));
		await expect(createEdgeTtsClient({ fetch: fetcher, timeoutMs: 30 }).listVoices()).rejects.toThrow('timed out');
		expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
	});
	it('cancels a pending voice fetch on client.close and prevents later calls', async () => {
		const fetcher = vi.fn<NonNullable<EdgeTtsClientOptions['fetch']>>(() => new Promise(() => {}));
		const client = createEdgeTtsClient({ fetch: fetcher });
		const pending = expect(client.listVoices()).rejects.toThrow('client is closed');
		await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
		await client.close();
		await pending;
		expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
		await expect(client.listVoices()).rejects.toThrow('client is closed');
	});
});
