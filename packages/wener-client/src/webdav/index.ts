import type { FetchLike } from '@wener/utils';
import { parseXml, xmlChild, xmlChildren, type XmlElement } from './xml';

export { parseXml, type XmlElement } from './xml';

export type WebDavAuth =
	| { type: 'basic'; username: string; password: string }
	| { type: 'bearer'; token: string };

export interface WebDavClientOptions {
	/** Base collection URL. Must not contain embedded credentials. */
	url: string;
	auth?: WebDavAuth;
	headers?: Record<string, string>;
	fetch?: FetchLike;
	/** Maximum PROPFIND response body size in bytes; default 8 MiB. */
	maxPropfindBytes?: number;
}

export interface WebDavRequestOptions {
	signal?: AbortSignal;
}

export interface WebDavEntry {
	/** Path relative to the client base URL, always starting with `/`. */
	path: string;
	name: string;
	type: 'file' | 'directory';
	size?: number;
	lastModified?: string;
	etag?: string;
	contentType?: string;
}

export interface WebDavReadResult {
	data: Uint8Array;
	size: number;
	contentType?: string;
	etag?: string;
}

export interface WebDavWriteOptions extends WebDavRequestOptions {
	contentType?: string;
	/** Default true. When false, sends `If-None-Match: *` so existing files are not replaced. */
	overwrite?: boolean;
}

export interface WebDavListOptions extends WebDavRequestOptions {
	/** Include the listed resource itself (useful to detect that a path is a file). */
	includeSelf?: boolean;
}

export interface WebDavReadStreamOptions extends WebDavRequestOptions {
	/** Inclusive byte range; sent as a `Range` header. */
	range?: { start: number; end?: number };
}

export interface WebDavReadStreamResult {
	body: ReadableStream<Uint8Array>;
	status: number;
	/** Content-Length of this response when known. */
	size?: number;
	contentType?: string;
	etag?: string;
}

export interface WebDavTransferOptions extends WebDavRequestOptions {
	/** COPY only: copy a collection without its members (`Depth: 0`). */
	shallow?: boolean;
	/** Default false; sends `Overwrite: F` unless enabled. */
	overwrite?: boolean;
}

export class WebDavError extends Error {
	override name = 'WebDavError';
	constructor(
		message: string,
		readonly status?: number,
	) {
		super(message);
	}
}

const PropfindBody =
	'<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/><d:getcontentlength/><d:getlastmodified/><d:getetag/><d:getcontenttype/></d:prop></d:propfind>';

/** Normalizes a client path into decoded segments; rejects traversal. */
export function normalizeWebDavPath(path: string): string[] {
	if (typeof path !== 'string' || path.includes('\0')) throw new WebDavError('Invalid WebDAV path');
	const segments: string[] = [];
	for (const segment of path.split('/')) {
		if (!segment || segment === '.') continue;
		if (segment === '..') throw new WebDavError('Invalid WebDAV path');
		segments.push(segment);
	}
	return segments;
}

/** Splits an encoded pathname, then decodes each segment; undefined for unsafe segments. */
function decodePathSegments(pathname: string): string[] | undefined {
	const segments: string[] = [];
	for (const raw of pathname.split('/')) {
		if (!raw) continue;
		let segment: string;
		try {
			segment = decodeURIComponent(raw);
		} catch {
			return undefined;
		}
		if (segment === '.' || segment === '..' || segment.includes('/') || segment.includes('\0')) return undefined;
		segments.push(segment);
	}
	return segments;
}

async function readBounded(response: Response, maxBytes: number | undefined, label: string): Promise<Uint8Array> {
	const length = Number(response.headers.get('content-length'));
	if (maxBytes !== undefined && Number.isFinite(length) && length > maxBytes) {
		await response.body?.cancel().catch(() => undefined);
		throw new WebDavError(`WebDAV ${label} exceeds ${maxBytes} bytes`);
	}
	const chunks: Uint8Array[] = [];
	let size = 0;
	if (response.body) {
		const reader = response.body.getReader();
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (maxBytes !== undefined && size > maxBytes) {
				await reader.cancel().catch(() => undefined);
				throw new WebDavError(`WebDAV ${label} exceeds ${maxBytes} bytes`);
			}
			chunks.push(value);
		}
	}
	const data = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) {
		data.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return data;
}

function toBytes(value: Uint8Array | string): Uint8Array {
	return typeof value === 'string' ? new TextEncoder().encode(value) : value;
}

function base64(value: string) {
	const bytes = new TextEncoder().encode(value);
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

export interface WebDavClient {
	readonly baseUrl: URL;
	list(path?: string, options?: WebDavListOptions): Promise<WebDavEntry[]>;
	/** Returns null when the resource does not exist. */
	stat(path: string, options?: WebDavRequestOptions): Promise<WebDavEntry | null>;
	read(path: string, options?: WebDavRequestOptions & { maxBytes?: number }): Promise<WebDavReadResult>;
	/** Streaming GET; the caller owns (and must consume or cancel) the body. */
	readStream(path: string, options?: WebDavReadStreamOptions): Promise<WebDavReadStreamResult>;
	write(path: string, data: Uint8Array | string | ReadableStream<Uint8Array>, options?: WebDavWriteOptions): Promise<{ etag?: string }>;
	mkdir(path: string, options?: WebDavRequestOptions): Promise<void>;
	remove(path: string, options?: WebDavRequestOptions): Promise<void>;
	move(from: string, to: string, options?: WebDavTransferOptions): Promise<void>;
	copy(from: string, to: string, options?: WebDavTransferOptions): Promise<void>;
}

export function createWebDavClient(options: WebDavClientOptions): WebDavClient {
	let baseUrl: URL;
	try {
		baseUrl = new URL(options.url);
	} catch {
		throw new WebDavError('Invalid WebDAV URL');
	}
	if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password)
		throw new WebDavError('WebDAV URL must be http(s) without credentials');
	baseUrl.search = '';
	baseUrl.hash = '';
	if (!baseUrl.pathname.endsWith('/')) baseUrl.pathname += '/';
	const basePath = decodePathSegments(baseUrl.pathname);
	if (!basePath) throw new WebDavError('Invalid WebDAV URL');
	const maxPropfindBytes = options.maxPropfindBytes ?? 8 * 1024 * 1024;
	const fetchImpl: FetchLike = options.fetch ?? ((input, init) => globalThis.fetch(input as RequestInfo | URL, init));

	const headers: Record<string, string> = { ...options.headers };
	if (options.auth?.type === 'basic') headers.Authorization = `Basic ${base64(`${options.auth.username}:${options.auth.password}`)}`;
	else if (options.auth?.type === 'bearer') headers.Authorization = `Bearer ${options.auth.token}`;

	function url(path: string, collection = false) {
		const segments = normalizeWebDavPath(path);
		const target = new URL(baseUrl);
		let pathname = baseUrl.pathname + segments.map(encodeURIComponent).join('/');
		if (collection && segments.length && !pathname.endsWith('/')) pathname += '/';
		target.pathname = pathname;
		return target;
	}

	async function request(method: string, target: URL, init: { headers?: Record<string, string>; body?: BodyInit; signal?: AbortSignal; ok?: number[] } = {}) {
		init.signal?.throwIfAborted();
		let response: Response;
		try {
			response = await fetchImpl(target.toString(), {
				method,
				headers: { ...headers, ...init.headers },
				body: init.body,
				// Required by fetch implementations for streaming request bodies.
				...(init.body instanceof ReadableStream ? { duplex: 'half' } : {}),
				signal: init.signal,
			});
		} catch {
			init.signal?.throwIfAborted();
			// Never echo transport errors: they may include the request URL or headers.
			throw new WebDavError(`WebDAV ${method} request failed`);
		}
		const ok = init.ok ?? [];
		if (!response.ok && !ok.includes(response.status)) {
			await response.body?.cancel().catch(() => undefined);
			throw new WebDavError(`WebDAV ${method} failed with status ${response.status}`, response.status);
		}
		return response;
	}

	function hrefToPath(href: string): string[] | undefined {
		let target: URL;
		try {
			target = new URL(href.trim(), baseUrl);
		} catch {
			return undefined;
		}
		if (target.origin !== baseUrl.origin) return undefined;
		const segments = decodePathSegments(target.pathname);
		if (!segments) return undefined;
		if (segments.length < basePath!.length || basePath!.some((segment, index) => segments[index] !== segment)) return undefined;
		return segments.slice(basePath!.length);
	}

	function parseEntries(xml: string): WebDavEntry[] {
		let root: XmlElement;
		try {
			root = parseXml(xml);
		} catch {
			throw new WebDavError('Invalid WebDAV multistatus response');
		}
		if (root.name !== 'multistatus') throw new WebDavError('Invalid WebDAV multistatus response');
		const entries: WebDavEntry[] = [];
		for (const response of xmlChildren(root, 'response')) {
			const href = xmlChild(response, 'href')?.text;
			if (!href) continue;
			const segments = hrefToPath(href);
			if (!segments) continue;
			const props = xmlChildren(response, 'propstat')
				.filter((propstat) => /\s2\d\d(\s|$)/.test(` ${xmlChild(propstat, 'status')?.text.trim() ?? 'HTTP/1.1 200 OK'}`))
				.flatMap((propstat) => xmlChildren(propstat, 'prop'));
			const prop = (name: string) => props.map((p) => xmlChild(p, name)).find(Boolean);
			const resourcetype = prop('resourcetype');
			const isDirectory = Boolean(resourcetype && xmlChild(resourcetype, 'collection'));
			const entry: WebDavEntry = {
				path: `/${segments.join('/')}`,
				name: segments[segments.length - 1] ?? '',
				type: isDirectory ? 'directory' : 'file',
			};
			const size = Number(prop('getcontentlength')?.text.trim());
			if (!isDirectory && prop('getcontentlength') && Number.isSafeInteger(size) && size >= 0) entry.size = size;
			const modified = prop('getlastmodified')?.text.trim();
			if (modified) {
				const date = new Date(modified);
				if (!Number.isNaN(date.getTime())) entry.lastModified = date.toISOString();
			}
			const etag = prop('getetag')?.text.trim();
			if (etag) entry.etag = etag;
			const contentType = prop('getcontenttype')?.text.trim();
			if (contentType) entry.contentType = contentType;
			entries.push(entry);
		}
		return entries;
	}

	async function propfind(path: string, depth: '0' | '1', signal?: AbortSignal) {
		const response = await request('PROPFIND', url(path), {
			headers: { Depth: depth, 'Content-Type': 'application/xml; charset=utf-8' },
			body: PropfindBody,
			signal,
			ok: depth === '0' ? [404] : [],
		});
		if (response.status === 404) {
			await response.body?.cancel().catch(() => undefined);
			return null;
		}
		if (response.status !== 207) throw new WebDavError(`WebDAV PROPFIND returned unexpected status ${response.status}`, response.status);
		return parseEntries(new TextDecoder().decode(await readBounded(response, maxPropfindBytes, 'PROPFIND response')));
	}

	function transfer(method: 'MOVE' | 'COPY') {
		return async (from: string, to: string, opts: WebDavTransferOptions = {}) => {
			if (!normalizeWebDavPath(from).length || !normalizeWebDavPath(to).length) throw new WebDavError('Invalid WebDAV path');
			await request(method, url(from), {
				headers: {
					Destination: url(to).toString(),
					Overwrite: opts.overwrite ? 'T' : 'F',
					...(method === 'COPY' && opts.shallow ? { Depth: '0' } : {}),
				},
				signal: opts.signal,
			}).then((response) => response.body?.cancel().catch(() => undefined));
		};
	}

	return {
		baseUrl,
		async list(path = '/', opts = {}) {
			const target = `/${normalizeWebDavPath(path).join('/')}`;
			const entries = (await propfind(path, '1', opts.signal)) ?? [];
			return opts.includeSelf ? entries : entries.filter((entry) => entry.path !== target);
		},
		async stat(path, opts = {}) {
			const target = `/${normalizeWebDavPath(path).join('/')}`;
			const entries = await propfind(path, '0', opts.signal);
			if (!entries) return null;
			return entries.find((entry) => entry.path === target) ?? entries[0] ?? null;
		},
		async readStream(path, opts = {}) {
			const extra: Record<string, string> = {};
			if (opts.range) {
				const { start, end } = opts.range;
				if (!Number.isSafeInteger(start) || start < 0 || (end !== undefined && (!Number.isSafeInteger(end) || end < start)))
					throw new WebDavError('Invalid WebDAV range');
				extra.Range = `bytes=${start}-${end ?? ''}`;
			}
			const response = await request('GET', url(path), { headers: extra, signal: opts.signal });
			const length = Number(response.headers.get('content-length') ?? Number.NaN);
			return {
				body: response.body ?? new ReadableStream<Uint8Array>({ start: (controller) => controller.close() }),
				status: response.status,
				size: Number.isSafeInteger(length) && length >= 0 ? length : undefined,
				contentType: response.headers.get('content-type') ?? undefined,
				etag: response.headers.get('etag') ?? undefined,
			};
		},
		async read(path, opts = {}) {
			const maxBytes = opts.maxBytes;
			const response = await request('GET', url(path), { signal: opts.signal });
			const data = await readBounded(response, maxBytes, 'file');
			const size = data.byteLength;
			return {
				data,
				size,
				contentType: response.headers.get('content-type') ?? undefined,
				etag: response.headers.get('etag') ?? undefined,
			};
		},
		async write(path, data, opts = {}) {
			if (!normalizeWebDavPath(path).length) throw new WebDavError('Invalid WebDAV path');
			const extra: Record<string, string> = {};
			if (opts.contentType) extra['Content-Type'] = opts.contentType;
			if (opts.overwrite === false) extra['If-None-Match'] = '*';
			const response = await request('PUT', url(path), { headers: extra, body: (data instanceof ReadableStream ? data : toBytes(data)) as BodyInit, signal: opts.signal });
			await response.body?.cancel().catch(() => undefined);
			return { etag: response.headers.get('etag') ?? undefined };
		},
		async mkdir(path, opts = {}) {
			if (!normalizeWebDavPath(path).length) throw new WebDavError('Invalid WebDAV path');
			const response = await request('MKCOL', url(path, true), { signal: opts.signal });
			await response.body?.cancel().catch(() => undefined);
		},
		async remove(path, opts = {}) {
			if (!normalizeWebDavPath(path).length) throw new WebDavError('Refusing to remove the WebDAV root');
			const response = await request('DELETE', url(path), { signal: opts.signal });
			await response.body?.cancel().catch(() => undefined);
		},
		move: transfer('MOVE'),
		copy: transfer('COPY'),
	};
}
