import { getAnsiStyle } from '../ansi/getAnsiStyle';
import { getHttpStatusText } from './HttpStatus';
import { isTextContentType } from './isTextContentType';

export type HttpDumpDirection = 'request' | 'response';
export type HttpDumpColorMode = boolean | 'auto' | 'always' | 'never';

export type HttpDumpHeaders = Headers | HeadersInit | Record<string, string | number | boolean | undefined | null>;

export interface HttpDumpMessage {
	direction?: HttpDumpDirection;
	method?: string;
	url?: string;
	status?: number;
	statusText?: string;
	headers?: HttpDumpHeaders;
	body?: unknown;
	httpVersion?: string;
}

export interface FormatHttpDumpOptions {
	color?: HttpDumpColorMode;
	maxBodyBytes?: number;
}

export interface FormatHttpBodyOptions {
	contentType?: string;
	maxBytes?: number;
	canPreviewStream?: boolean;
}

function requestTarget(url: string | undefined): { target: string; host?: string } {
	if (!url) return { target: '/' };
	try {
		const parsed = new URL(url);
		return { target: `${parsed.pathname || '/'}${parsed.search}`, host: parsed.host };
	} catch {
		return { target: url };
	}
}

function normalizeHeaders(headers: HttpDumpHeaders | undefined): Record<string, string> {
	if (!headers) return {};
	if (typeof Headers !== 'undefined' && headers instanceof Headers) return Object.fromEntries(headers.entries());
	if (Array.isArray(headers)) return Object.fromEntries(headers.map(([key, value]) => [key, value]));
	return Object.fromEntries(
		Object.entries(headers).flatMap(([key, value]) =>
			value === undefined || value === null ? [] : [[key, String(value)]],
		),
	);
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
	const wanted = name.toLowerCase();
	return Object.keys(headers).some((key) => key.toLowerCase() === wanted);
}

function findHeader(headers: Record<string, string>, name: string): string | undefined {
	const wanted = name.toLowerCase();
	for (const [key, value] of Object.entries(headers)) {
		if (key.toLowerCase() === wanted) return value;
	}
	return undefined;
}

function sortHeaders(headers: Record<string, string>): Array<[string, string]> {
	return Object.entries(headers).sort(([a], [b]) => a.localeCompare(b));
}

function truncateText(text: string, maxBytes: number): string {
	const bytes = new TextEncoder().encode(text);
	if (bytes.length <= maxBytes) return text;
	const truncated = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, maxBytes));
	return `${truncated}\n[... truncated to ${maxBytes} bytes]`;
}

function prettyJsonText(text: string): string {
	try {
		return JSON.stringify(JSON.parse(text), undefined, 2);
	} catch {
		return text;
	}
}

function formatArrayBufferLike(body: ArrayBuffer | ArrayBufferView, maxBytes: number, contentType: string): string {
	const bytes =
		body instanceof ArrayBuffer ? new Uint8Array(body) : new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
	if (!isTextContentType(contentType))
		return `[Binary content not displayed: ${bytes.byteLength} bytes${contentType ? `; ${contentType}` : ''}]`;
	return truncateText(new TextDecoder('utf-8', { fatal: false }).decode(bytes), maxBytes);
}

function formatFormData(body: FormData): string {
	const lines = ['[FormData content]'];
	for (const [key, value] of body.entries()) {
		if (typeof value === 'string') {
			lines.push(`${key}: ${value}`);
		} else {
			const file = value as File;
			lines.push(`${key}: [File: ${file.name || 'unknown'}; ${file.size} bytes${file.type ? `; ${file.type}` : ''}]`);
		}
	}
	return lines.join('\n');
}

async function formatReadableStream(
	body: ReadableStream,
	options: Required<Pick<FormatHttpBodyOptions, 'canPreviewStream' | 'maxBytes'>> & { contentType: string },
): Promise<string> {
	if (!options.canPreviewStream) return '[ReadableStream - cannot preview external stream]';
	try {
		const reader = body.getReader();
		let previewedBytes = 0;
		const chunks: Uint8Array[] = [];
		let truncated = false;
		while (previewedBytes < options.maxBytes) {
			const { done, value } = await reader.read();
			if (done) break;
			const bytes = value instanceof Uint8Array ? value : new TextEncoder().encode(String(value));
			const remaining = options.maxBytes - previewedBytes;
			chunks.push(bytes.length > remaining ? bytes.slice(0, remaining) : bytes);
			previewedBytes += Math.min(bytes.length, remaining);
			if (bytes.length > remaining) {
				truncated = true;
				break;
			}
		}
		if (previewedBytes >= options.maxBytes) truncated = true;
		reader.releaseLock();
		const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
		const merged = new Uint8Array(total);
		let offset = 0;
		for (const chunk of chunks) {
			merged.set(chunk, offset);
			offset += chunk.length;
		}
		const text = formatArrayBufferLike(merged, options.maxBytes, options.contentType);
		return truncated ? `${text}\n[... truncated to ${options.maxBytes} bytes]` : text;
	} catch (error) {
		return `[Error reading stream: ${error instanceof Error ? error.message : String(error)}]`;
	}
}

export async function formatHttpBody(body: unknown, options: FormatHttpBodyOptions = {}): Promise<string | undefined> {
	if (body === undefined || body === null) return undefined;
	const contentType = options.contentType ?? '';
	const maxBytes = options.maxBytes ?? 64 * 1024;
	const canPreviewStream = options.canPreviewStream ?? false;

	if (typeof body === 'string')
		return truncateText(contentType.includes('json') ? prettyJsonText(body) : body, maxBytes);
	if (body instanceof URLSearchParams) return body.toString();
	if (typeof FormData !== 'undefined' && body instanceof FormData) return formatFormData(body);
	if (typeof Blob !== 'undefined' && body instanceof Blob)
		return `[Blob content not displayed: ${body.size} bytes${body.type ? `; ${body.type}` : ''}]`;
	if (body instanceof ArrayBuffer || ArrayBuffer.isView(body))
		return formatArrayBufferLike(body, maxBytes, contentType);
	if (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream)
		return formatReadableStream(body, { contentType, maxBytes, canPreviewStream });
	if (typeof body === 'object') return truncateText(JSON.stringify(body, undefined, 2), maxBytes);
	return String(body);
}

export async function formatHttpDump(message: HttpDumpMessage, options: FormatHttpDumpOptions = {}): Promise<string> {
	const c = getAnsiStyle(options.color ?? 'never');
	const httpVersion = message.httpVersion ?? 'HTTP/1.1';
	const headers = normalizeHeaders(message.headers);
	const direction =
		message.direction ?? (message.status !== undefined || message.statusText !== undefined ? 'response' : 'request');
	const lines: string[] = [];

	if (direction === 'request') {
		const { target, host } = requestTarget(message.url);
		if (host && !hasHeader(headers, 'host')) headers.Host = host;
		lines.push(c.bold(`${message.method ?? 'GET'} ${target} ${httpVersion}`));
	} else {
		const status = message.status ?? 0;
		const statusText = message.statusText ?? getHttpStatusText(status);
		const statusLabel = statusText ? ` ${statusText}` : '';
		const statusColor = status >= 200 && status < 300 ? c.green : status >= 400 ? c.red : c.yellow;
		lines.push(statusColor(`${httpVersion} ${status}${statusLabel}`));
	}

	for (const [key, value] of sortHeaders(headers)) lines.push(c.cyan(`${key}:`) + ` ${value}`);
	const body = await formatHttpBody(message.body, {
		contentType: findHeader(headers, 'content-type') ?? '',
		maxBytes: options.maxBodyBytes,
	});
	lines.push('');
	if (body !== undefined && body !== '') lines.push(body);
	return lines.join('\n');
}
