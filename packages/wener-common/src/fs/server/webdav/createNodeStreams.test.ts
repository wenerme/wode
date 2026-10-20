import { once } from 'node:events';
import { createServer, type RequestListener, type Server } from 'node:http';
import { Readable, Writable } from 'node:stream';
import { buffer } from 'node:stream/consumers';
import { finished, pipeline } from 'node:stream/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createClient } from 'webdav';
import type { IServerFileSystem } from '../IFileSystem';
import { createWebDavNodeFileSystem } from './createWebDavNodeFileSystem';

describe('WebDAV Node stream lifecycle', () => {
	let server: Server;
	let handler: RequestListener;
	let fs: IServerFileSystem;

	beforeEach(async () => {
		server = createServer((req, res) => handler(req, res));
		server.listen(0, '127.0.0.1');
		await once(server, 'listening');
		const address = server.address();
		if (!address || typeof address === 'string') throw new Error('Expected a TCP address');
		fs = createWebDavNodeFileSystem({ client: createClient(`http://127.0.0.1:${address.port}`) });
	});

	afterEach(async () => {
		server.closeAllConnections();
		await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
	});

	it('returns a real Node readable and forwards byte ranges without changing data', async () => {
		let range: string | undefined;
		handler = (req, res) => {
			range = req.headers.range;
			res.writeHead(206);
			res.write(Buffer.from([0, 128]));
			res.end(Buffer.from([255, 42]));
		};
		const stream = fs.createReadStream('/file', { range: { start: 2, end: 5 } });
		expect(stream).toBeInstanceOf(Readable);
		expect(await buffer(stream)).toEqual(Buffer.from([0, 128, 255, 42]));
		expect(range).toBe('bytes=2-5');
		expect(stream.readableEnded).toBe(true);
	});

	it.each([
		['text', (): string => 'payload'],
		['buffer view', (): Buffer => Buffer.from('_payload_').subarray(1, 8)],
		['Node readable', (): Readable => Readable.from(['payload'])],
		[
			'Web readable',
			(): ReadableStream<Uint8Array> =>
				new ReadableStream<Uint8Array>({
					start(controller) {
						controller.enqueue(Buffer.from('payload'));
						controller.close();
					},
				}),
		],
	] as const)('preserves writeFile content for %s', async (_name, data) => {
		const received = Promise.withResolvers<Buffer>();
		handler = (req, res) => {
			void buffer(req).then((body) => {
				received.resolve(body);
				res.writeHead(201).end();
			});
		};
		await fs.writeFile('/file', data());
		expect((await received.promise).toString()).toBe('payload');
	});

	it('waits for the successful PUT response before finish and preserves large writes', async () => {
		const received = Promise.withResolvers<Buffer>();
		const respond = Promise.withResolvers<void>();
		let overwrite: string | string[] | undefined;
		handler = (req, res) => {
			overwrite = req.headers['if-none-match'];
			void buffer(req).then(async (data) => {
				received.resolve(data);
				await respond.promise;
				res.writeHead(201).end();
			});
		};
		const data = Buffer.alloc(2 * 1024 * 1024, 231);
		const stream = fs.createWriteStream('/file', { overwrite: false });
		expect(stream).toBeInstanceOf(Writable);
		const writing = pipeline(Readable.from([data.subarray(0, 65536), data.subarray(65536)]), stream);
		expect((await received.promise).equals(data)).toBe(true);
		expect(stream.writableFinished).toBe(false);
		respond.resolve();
		await writing;
		expect(stream.writableFinished).toBe(true);
		expect(overwrite).toBe('*');
	});

	it('propagates GET errors', async () => {
		handler = (_req, res) => res.writeHead(404).end();
		await expect(buffer(fs.createReadStream('/missing'))).rejects.toMatchObject({ status: 404 });
	});

	it('propagates a truncated GET response after data has arrived', async () => {
		const disconnect = Promise.withResolvers<() => void>();
		handler = (_req, res) => {
			disconnect.resolve(() => res.destroy());
			res.writeHead(200, { 'content-length': '100' });
			res.write('first');
		};
		const stream = fs.createReadStream('/truncated');
		const reading = finished(stream);
		const rejected = expect(reading).rejects.toThrow();
		await once(stream, 'data');
		(await disconnect.promise)();
		await rejected;
		expect(stream.readableEnded).toBe(false);
	});

	it('rejects failed uploads after the complete body instead of emitting finish', async () => {
		handler = (req, res) => {
			req.resume();
			req.on('end', () => res.writeHead(403).end());
		};
		const stream = fs.createWriteStream('/denied');
		const writing = finished(stream);
		stream.end('payload');
		await expect(writing).rejects.toMatchObject({ status: 403 });
		expect(stream.writableFinished).toBe(false);
	});

	it('propagates transport errors while uploading', async () => {
		handler = (req) => req.socket.destroy();
		const stream = fs.createWriteStream('/reset');
		const writing = finished(stream);
		stream.end('payload');
		await expect(writing).rejects.toThrow();
		expect(stream.writableFinished).toBe(false);
	});

	it.each(['abort', 'destroy'] as const)('cancels an active GET with %s and closes the request', async (action) => {
		const closed = Promise.withResolvers<void>();
		handler = (req, res) => {
			req.socket.on('close', () => closed.resolve());
			res.writeHead(200);
			res.write('first');
		};
		const controller = new AbortController();
		const stream = fs.createReadStream('/slow', { signal: controller.signal });
		const reading = finished(stream);
		const rejected = expect(reading).rejects.toMatchObject({
			code: action === 'abort' ? 'ABORT_ERR' : 'ERR_STREAM_PREMATURE_CLOSE',
		});
		await once(stream, 'data');
		if (action === 'abort') controller.abort();
		else stream.destroy();
		await rejected;
		await closed.promise;
		expect(stream.destroyed).toBe(true);
	});

	it.each(['abort', 'destroy'] as const)('cancels an active PUT with %s and closes the request', async (action) => {
		const started = Promise.withResolvers<void>();
		const closed = Promise.withResolvers<void>();
		handler = (req) => {
			req.socket.on('close', () => closed.resolve());
			req.on('error', () => undefined);
			req.once('data', () => started.resolve());
		};
		const controller = new AbortController();
		const stream = fs.createWriteStream('/slow', { signal: controller.signal });
		const writing = finished(stream);
		const rejected = expect(writing).rejects.toMatchObject({
			code: action === 'abort' ? 'ABORT_ERR' : 'ERR_STREAM_PREMATURE_CLOSE',
		});
		stream.write('first');
		await started.promise;
		if (action === 'abort') controller.abort();
		else stream.destroy();
		await rejected;
		await closed.promise;
		expect(stream.writableFinished).toBe(false);
	});

	it.each(['read', 'write'] as const)('honors an already aborted signal for %s', async (kind) => {
		handler = (_req, res) => res.end();
		const signal = AbortSignal.abort();
		const stream =
			kind === 'read' ? fs.createReadStream('/file', { signal }) : fs.createWriteStream('/file', { signal });
		await expect(finished(stream)).rejects.toMatchObject({ code: 'ABORT_ERR' });
	});
});
