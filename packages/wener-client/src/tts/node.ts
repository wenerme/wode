import WebSocket, { type RawData } from 'ws';
import type { EdgeTtsSocket, EdgeTtsSocketFactory } from './types';

/** Constructing the factory is side-effect free; only invoking it opens a socket. */
export function createNodeEdgeTtsSocketFactory(): EdgeTtsSocketFactory {
	return (url, options): EdgeTtsSocket => {
		const ws = new WebSocket(url, { headers: { ...options.headers }, perMessageDeflate: true });
		const opens = new Set<() => void>();
		const messages = new Set<(data: string | Uint8Array) => void>();
		const errors = new Set<(error?: { status?: number; date?: string }) => void>();
		const closes = new Set<() => void>();
		let closing = false;
		let resolveClosed!: () => void;
		const closed = new Promise<void>((resolve) => { resolveClosed = resolve; });
		let closeTimer: ReturnType<typeof setTimeout> | undefined;
		const emitError = (value?: { status?: number; date?: string }) => {
			for (const listener of errors) listener(value);
		};
		// Keep this listener for the entire ws lifetime, including CONNECTING close.
		ws.on('error', () => emitError());
		ws.on('unexpected-response', (request, response) => {
			const rawDate = response.headers.date;
			const date = typeof rawDate === 'string' && rawDate.length <= 128 && Number.isFinite(Date.parse(rawDate))
				? new Date(Date.parse(rawDate)).toUTCString() : undefined;
			const status = response.statusCode;
			response.on('error', () => {});
			request.on('error', () => {});
			response.resume();
			emitError({ status: typeof status === 'number' && status >= 100 && status <= 599 ? status : undefined, date });
			response.destroy();
			request.destroy();
			ws.terminate();
		});
		ws.on('open', () => { if (!closing) for (const listener of opens) listener(); });
		ws.on('message', (data: RawData, binary: boolean) => {
			if (closing) return;
			const bytes = Array.isArray(data) ? Buffer.concat(data) : Buffer.isBuffer(data) ? data : Buffer.from(data);
			for (const listener of messages) listener(binary ? new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength) : bytes.toString('utf8'));
		});
		ws.once('close', () => {
			clearTimeout(closeTimer);
			resolveClosed();
			for (const listener of closes) listener();
			opens.clear(); messages.clear(); errors.clear(); closes.clear();
		});
		function on<T>(listeners: Set<T>, listener: T): () => void {
			listeners.add(listener);
			return () => { listeners.delete(listener); };
		}
		return {
			get readyState() { return ws.readyState; },
			send(data) {
				if (closing || ws.readyState !== WebSocket.OPEN) throw new Error('Edge TTS socket is not open');
				ws.send(data, (error) => { if (error) emitError(); });
			},
			close() {
				if (!closing) {
					closing = true;
					if (ws.readyState === WebSocket.CONNECTING) ws.terminate();
					else if (ws.readyState === WebSocket.OPEN) {
						ws.close();
						closeTimer = setTimeout(() => ws.terminate(), 250);
					}
				}
				return closed;
			},
			onOpen: (listener) => on(opens, listener),
			onMessage: (listener) => on(messages, listener),
			onError: (listener) => on(errors, listener),
			onClose: (listener) => on(closes, listener),
		};
	};
}
