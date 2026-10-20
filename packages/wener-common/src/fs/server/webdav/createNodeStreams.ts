import Stream, { type Readable, type Writable } from 'node:stream';
import type { WebDAVClient } from 'webdav';
import type { CreateReadStreamOptions, CreateWriteStreamOptions } from '../../IFileSystem';

export function createWebDavReadStream(
	client: WebDAVClient,
	path: string,
	options: CreateReadStreamOptions = {},
): Readable {
	const controller = new AbortController();
	const source = client.createReadStream(path, { ...options, signal: controller.signal });
	let ended = false;
	let responseBody: Readable | undefined;
	const stream = new Stream.PassThrough({
		signal: options.signal,
		destroy(error, callback) {
			if (!ended) controller.abort();
			responseBody?.destroy(error ?? undefined);
			source.destroy(error ?? undefined);
			callback(error);
		},
	});
	// WebDAV pipes the HTTP body into its returned stream without forwarding
	// body errors. The Node pipe event exposes that body before data can flow.
	source.on('pipe', (body: unknown) => {
		if (!(body instanceof Stream.Readable)) return;
		responseBody = body;
		body.on('error', (error: Error) => stream.destroy(error));
		body.once('close', () => {
			if (!body.readableEnded && !stream.destroyed) {
				stream.destroy(new Error('WebDAV response closed before end'));
			}
		});
		if (stream.destroyed) body.destroy();
	});
	source.on('error', (error: Error) => stream.destroy(error));
	source.once('end', () => {
		ended = true;
	});
	source.once('close', () => {
		if (!ended && !stream.destroyed) stream.destroy(new Error('WebDAV read stream closed before end'));
	});
	source.pipe(stream);
	return stream;
}

export function createWebDavWriteStream(
	client: WebDAVClient,
	path: string,
	options: CreateWriteStreamOptions = {},
): Writable {
	const controller = new AbortController();
	let uploaded = false;
	let ended = false;
	let complete: (() => void) | undefined;
	const destination = client.createWriteStream(path, { ...options, signal: controller.signal }, () => {
		uploaded = true;
		complete?.();
	});
	const stream = new Stream.Writable({
		signal: options.signal,
		write(chunk, _encoding, callback) {
			destination.write(chunk, callback);
		},
		final(callback) {
			// WebDAV's local PassThrough finish precedes the PUT response. Only
			// acknowledge completion after both the body and the HTTP request succeed.
			complete = () => {
				if (!ended || !uploaded) return;
				complete = undefined;
				callback();
			};
			destination.end(() => {
				ended = true;
				complete?.();
			});
		},
		destroy(error, callback) {
			complete = undefined;
			if (!uploaded) controller.abort();
			destination.destroy(error ?? undefined);
			callback(error);
		},
	});
	destination.on('error', (error: Error) => stream.destroy(error));
	destination.once('close', () => {
		if (!ended && !stream.destroyed) stream.destroy(new Error('WebDAV write stream closed before finish'));
	});
	return stream;
}
