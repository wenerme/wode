import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { Socket } from 'node:net';
import { WebSocketServer } from 'ws';
import { afterEach, describe, expect, it } from 'vitest';
import { createNodeEdgeTtsSocketFactory } from './node';
import type { EdgeTtsSocket } from './types';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });

async function server(configure: (server: Server) => void) {
	const http = createServer();
	const connections = new Set<Socket>();
	http.on('connection', (s) => { connections.add(s); s.once('close', () => connections.delete(s)); });
	configure(http);
	http.listen(0, '127.0.0.1');
	await once(http, 'listening');
	cleanups.push(async () => {
		for (const s of connections) s.destroy();
		await new Promise<void>((resolve) => http.close(() => resolve()));
	});
	const address = http.address();
	if (!address || typeof address === 'string') throw new Error('Missing test server address');
	return `ws://127.0.0.1:${address.port}`;
}

function closed(socket: EdgeTtsSocket) { return new Promise<void>((resolve) => socket.onClose(resolve)); }
function opened(socket: EdgeTtsSocket) { return new Promise<void>((resolve, reject) => { socket.onOpen(resolve); socket.onError(() => reject(new Error('Unexpected socket failure'))); }); }

describe('Node Edge socket adapter', () => {
	it('creates a lazy factory without touching network or environment', () => {
		expect(typeof createNodeEdgeTtsSocketFactory()).toBe('function');
	});

	it('handles CONNECTING close without an unhandled error and waits for terminal state', async () => {
		const url = await server(() => {});
		const socket = createNodeEdgeTtsSocketFactory()(url, { headers: {} });
		const done = closed(socket);
		const first = socket.close();
		expect(socket.close()).toBe(first);
		await Promise.all([first, done]);
		expect(socket.readyState).toBe(3);
	});

	it('forwards ordered text/binary messages and removes unsubscribed listeners', async () => {
		const url = await server((http) => {
			const wss = new WebSocketServer({ server: http });
			wss.on('connection', (ws) => ws.on('message', () => {
				ws.send('Path:turn.start\r\n\r\n');
				ws.send(new Uint8Array([1, 2, 3]));
				ws.send('Path:turn.end\r\n\r\n');
			}));
		});
		const socket = createNodeEdgeTtsSocketFactory()(url, { headers: { 'User-Agent': 'tts-offline-test' } });
		const result: Array<string | number[]> = [];
		let removedCalls = 0;
		const off = socket.onMessage(() => removedCalls++);
		off();
		const received = new Promise<void>((resolve) => socket.onMessage((data) => {
			result.push(typeof data === 'string' ? data : [...data]);
			if (result.length === 3) resolve();
		}));
		await opened(socket);
		socket.send('request');
		await received;
		expect(result).toEqual(['Path:turn.start\r\n\r\n', [1, 2, 3], 'Path:turn.end\r\n\r\n']);
		expect(removedCalls).toBe(0);
		await socket.close();
		expect(socket.readyState).toBe(3);
		expect(() => socket.send('late')).toThrow('not open');
	});

	it('consumes failed upgrades and exposes only numeric status and normalized Date', async () => {
		const date = 'Tue, 03 Nov 2026 20:36:03 GMT';
		const url = await server((http) => {
			http.on('upgrade', (_request, socket) => {
				socket.write(`HTTP/1.1 403 Forbidden\r\nDate: ${date}\r\nContent-Length: 12\r\nX-Private: SECRET\r\n\r\nPRIVATE BODY`);
			});
		});
		const socket = createNodeEdgeTtsSocketFactory()(`${url}/?PRIVATE-TOKEN`, { headers: {} });
		const terminal = closed(socket);
		const error = await new Promise<unknown>((resolve) => socket.onError((value) => { if (value) resolve(value); }));
		expect(error).toEqual({ status: 403, date });
		await Promise.all([terminal, socket.close()]);
		expect(socket.readyState).toBe(3);
	});

	it('terminates a peer that never acknowledges the close frame', async () => {
		const url = await server((http) => {
			http.on('upgrade', (request, socket) => {
				const accept = createHash('sha1').update(`${request.headers['sec-websocket-key']}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
				socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
				socket.on('data', () => {});
			});
		});
		const socket = createNodeEdgeTtsSocketFactory()(url, { headers: {} });
		await opened(socket);
		await socket.close();
		expect(socket.readyState).toBe(3);
	});
});
