import type { EdgeTtsSocket, EdgeTtsSocketFactory } from '@wener/client/tts';
import { createMemoryCliConfigStore } from 'common/context';
import { expect, it, vi } from 'vitest';
import { createCli, type CliHost } from './createCli';

const audio = new Uint8Array([73, 68, 51, 4, 0, 0, 255, 251, 1, 2, 3]);

function socketFixture(stall = false) {
	const frames: string[] = [];
	const active = new Set<EdgeTtsSocket>();
	let created!: () => void;
	const ready = new Promise<void>((resolve) => { created = resolve; });
	const factory = vi.fn<EdgeTtsSocketFactory>(() => {
		let state = 0;
		const opened = new Set<() => void>();
		const messages = new Set<(data: string | Uint8Array) => void>();
		const errors = new Set<(error?: { status?: number; date?: string }) => void>();
		const closed = new Set<() => void>();
		const socket: EdgeTtsSocket = {
			get readyState() { return state; },
			send(frame) {
				frames.push(frame);
				if (stall || !/Path:\s*ssml/iu.test(frame)) return;
				const id = /X-RequestId:([^\r\n]+)/iu.exec(frame)?.[1]?.trim() ?? '';
				const headers = new TextEncoder().encode(`X-RequestId:${id}\r\nContent-Type:audio/mpeg\r\nPath:audio\r\n`);
				const data = new Uint8Array(2 + headers.length + audio.length);
				new DataView(data.buffer).setUint16(0, headers.length);
				data.set(headers, 2); data.set(audio, 2 + headers.length);
				queueMicrotask(() => {
					for (const receive of messages) receive(data);
					for (const receive of messages) receive(`X-RequestId:${id}\r\nPath:turn.end\r\n\r\n`);
				});
			},
			async close() {
				if (state === 3) return;
				state = 3; active.delete(socket);
				for (const receive of closed) receive();
			},
			onOpen(listener) { opened.add(listener); return () => { opened.delete(listener); }; },
			onMessage(listener) { messages.add(listener); return () => { messages.delete(listener); }; },
			onError(listener) { errors.add(listener); return () => { errors.delete(listener); }; },
			onClose(listener) { closed.add(listener); return () => { closed.delete(listener); }; },
		};
		active.add(socket);
		queueMicrotask(() => { state = 1; for (const open of opened) open(); created(); });
		return socket;
	});
	return { factory, frames, active, ready };
}

function fixture(services: unknown[] = [], overrides: Partial<CliHost> = {}) {
	const config = createMemoryCliConfigStore({ services });
	const save = vi.spyOn(config, 'save');
	const sockets = socketFixture();
	const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json([
		{ ShortName: 'zh-CN-XiaoxiaoNeural', FriendlyName: 'Xiaoxiao', Locale: 'zh-CN', Gender: 'Female' },
		{ ShortName: 'en-US-JennyNeural', FriendlyName: 'Jenny', Locale: 'en-US', Gender: 'Female' },
	]));
	const writeBytes = vi.fn<NonNullable<CliHost['writeBytes']>>(async () => undefined);
	const readText = vi.fn<NonNullable<CliHost['readText']>>(async (value) => value === '-' ? 'Stdin speech' : 'File speech');
	const getEnv = vi.fn(() => { throw new Error('Unexpected credential lookup'); });
	const cli = createCli({ config, edgeTtsSocketFactory: sockets.factory, fetch, writeBytes, readText, getEnv, ...overrides });
	const controller = new AbortController();
	const lines: string[] = [];
	return { cli, config, save, sockets, fetch, writeBytes, readText, getEnv, controller, lines,
		io: { signal: controller.signal, stdout: (line: string) => lines.push(line) } };
}

it('discovers TTS and its built-in default without network, input, credentials or config writes', async () => {
	const f = fixture();
	for (const command of ['tts --help', 'tts speak --help', 'tts voices --help', 'tts --list-services --json', 'service type edge-tts --typescript'])
		await f.cli.executeLine(command, f.io);
	expect(f.cli.catalog().commands.some((command) => command.name === 'tts')).toBe(true);
	expect(f.cli.catalog().providers.map((provider) => provider.name)).toEqual(expect.arrayContaining(['edge-tts', 'openai-tts']));
	expect(f.fetch).not.toHaveBeenCalled();
	expect(f.sockets.factory).not.toHaveBeenCalled();
	expect(f.getEnv).not.toHaveBeenCalled();
	expect(f.readText).not.toHaveBeenCalled();
	expect(f.save).not.toHaveBeenCalled();
});

it('synthesizes through the complete built-in Edge service and writes binary MP3', async () => {
	const f = fixture();
	await f.cli.executeLine('tts "Hello & goodbye" --output-file hello.mp3 --json', f.io);
	expect(f.writeBytes).toHaveBeenCalledWith('hello.mp3', audio, { signal: f.controller.signal });
	expect(JSON.parse(f.lines.join(''))).toMatchObject({ file: 'hello.mp3', provider: 'edge-tts', format: 'mp3', byteLength: audio.length });
	expect(f.sockets.frames.join('\n')).toContain('zh-CN-XiaoxiaoNeural');
	expect(f.sockets.frames.join('\n')).toContain('Hello &amp; goodbye');
	expect(f.sockets.active.size).toBe(0);
	expect(f.getEnv).not.toHaveBeenCalled();
	expect(f.save).not.toHaveBeenCalled();
	expect(Object.keys((await f.config.load()).services ?? {})).toHaveLength(0);
});

it.each(['@speech.txt', '-'])('supports file or stdin text through the explicit host port: %s', async (input) => {
	const f = fixture();
	await f.cli.executeLine(`tts speak --input ${input} --output-file speech.mp3`, f.io);
	expect(f.readText).toHaveBeenCalledWith(input, { signal: f.controller.signal, maxBytes: 100_000 });
	expect(f.writeBytes).toHaveBeenCalledTimes(1);
});

it('lists and filters Edge voices without opening a WebSocket', async () => {
	const f = fixture();
	await f.cli.executeLine('tts voices --locale zh-CN --json', f.io);
	expect(JSON.parse(f.lines.join(''))).toMatchObject({ supported: true, voices: [{ id: 'zh-CN-XiaoxiaoNeural' }] });
	expect(f.sockets.factory).not.toHaveBeenCalled();
	expect(f.writeBytes).not.toHaveBeenCalled();
});

it.each([
	'tts "Hello"',
	'tts --input @speech.txt --text hello --output-file speech.mp3',
	'tts --input speech.txt --output-file speech.mp3',
	'tts --input @speech.txt --speed 9 --output-file speech.mp3',
	'tts --input @speech.txt --service absent --output-file speech.mp3',
])('rejects invalid input before creating clients or reading files: %s', async (command) => {
	const f = fixture();
	await expect(f.cli.executeLine(command, f.io)).rejects.toThrow();
	expect(f.sockets.factory).not.toHaveBeenCalled();
	expect(f.fetch).not.toHaveBeenCalled();
	expect(f.readText).not.toHaveBeenCalled();
});

it('rejects unsupported sinks before input or synthesis and keeps binary stdout free of metadata', async () => {
	const absent = fixture([], { writeBytes: undefined });
	await expect(absent.cli.executeLine('tts --input @speech.txt --output-file speech.mp3', absent.io)).rejects.toThrow('binary file output');
	expect(absent.readText).not.toHaveBeenCalled();
	const f = fixture();
	await expect(f.cli.executeLine('tts hello --output-file -', f.io)).rejects.toThrow('binary stdout');
	const bytes: Uint8Array[] = [];
	const stream = new WritableStream<Uint8Array>({ write(chunk) { bytes.push(chunk); } });
	await expect(f.cli.executeLine('tts hello --output-file - --json', { ...f.io, stdoutStream: stream })).rejects.toThrow('formatted output');
	expect(f.sockets.factory).not.toHaveBeenCalled();
	await f.cli.executeLine('tts hello --output-file -', { ...f.io, stdoutStream: stream });
	expect(bytes).toEqual([audio]);
	expect(f.lines).toEqual([]);
	expect(stream.locked).toBe(false);
});

it.each(['edge-tts', 'openai-tts'])('does not activate a fallback around a disabled configured provider: %s', async (type) => {
	const f = fixture([{ name: 'speech', type, disabled: true }]);
	await expect(f.cli.executeLine('tts hello --output-file speech.mp3', f.io)).rejects.toThrow();
	expect(f.sockets.factory).not.toHaveBeenCalled();
	expect(f.fetch).not.toHaveBeenCalled();
});

it('uses a configured model provider, custom model and voice with lazy authentication', async () => {
	const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(audio, { headers: { 'content-type': 'audio/wav' } }));
	const getEnv = vi.fn(() => 'example-key');
	const f = fixture([{ name: 'models', type: 'openai-tts', baseUrl: 'https://speech.example.test/v1',
		options: { apiKeyEnv: 'EXAMPLE_TTS_KEY', model: 'default-model', voice: 'default-voice' } }], { fetch, getEnv });
	await f.cli.executeLine('tts hello --model custom-model --voice custom-voice --audio-format wav --speed 1.2 --output-file speech.wav --json', f.io);
	expect(f.sockets.factory).not.toHaveBeenCalled();
	expect(fetch).toHaveBeenCalledTimes(1);
	const [url, init] = fetch.mock.calls[0]!;
	expect(String(url)).toBe('https://speech.example.test/v1/audio/speech');
	expect(JSON.parse(String(init?.body))).toMatchObject({ input: 'hello', model: 'custom-model', voice: 'custom-voice', response_format: 'wav', speed: 1.2 });
	expect(new Headers(init?.headers).get('authorization')).toBe('Bearer example-key');
	expect(f.writeBytes).toHaveBeenCalledWith('speech.wav', audio, { signal: f.controller.signal });
});

it('rejects ambiguous configured TTS services rather than silently using Edge', async () => {
	const f = fixture([{ name: 'one', type: 'edge-tts' }, { name: 'two', type: 'edge-tts' }]);
	await expect(f.cli.executeLine('tts hello --output-file speech.mp3', f.io)).rejects.toThrow('Select one tts service');
	expect(f.sockets.factory).not.toHaveBeenCalled();
});

it.each([
	'--rate +1%', '--pitch +5Hz', '--volume=-10%',
])('validates model-provider options before file, credentials or network: %s', async (flags) => {
	const f = fixture([{ name: 'models', type: 'openai-tts', options: { model: 'example-model', apiKeyEnv: 'EXAMPLE_TTS_KEY' } }]);
	await expect(f.cli.executeLine(`tts --input @speech.txt ${flags} --output-file speech.mp3`, f.io)).rejects.toThrow();
	expect(f.readText).not.toHaveBeenCalled();
	expect(f.getEnv).not.toHaveBeenCalled();
	expect(f.fetch).not.toHaveBeenCalled();
	expect(f.sockets.factory).not.toHaveBeenCalled();
});

it.each([
	'--output-file speech.wav',
	'--output-file speech.mp3 --model unsupported',
	'--output-file speech.mp3 --instructions unsupported',
	'--output-file speech.mp3 --speed 1.2 --rate +10%',
])('validates Edge options before consuming stdin: %s', async (flags) => {
	const f = fixture();
	await expect(f.cli.executeLine(`tts --input - ${flags}`, f.io)).rejects.toThrow();
	expect(f.readText).not.toHaveBeenCalled();
	expect(f.getEnv).not.toHaveBeenCalled();
	expect(f.fetch).not.toHaveBeenCalled();
	expect(f.sockets.factory).not.toHaveBeenCalled();
});

it('propagates cancellation and releases an in-flight Edge socket without writing output', async () => {
	const sockets = socketFixture(true);
	const f = fixture([], { edgeTtsSocketFactory: sockets.factory });
	const pending = f.cli.executeLine('tts hello --output-file speech.mp3', f.io);
	await sockets.ready;
	f.controller.abort(new Error('Fixture cancelled'));
	await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
	expect(f.writeBytes).not.toHaveBeenCalled();
	expect(sockets.active.size).toBe(0);
});
