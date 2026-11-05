import type { FetchLike } from '@wener/utils';
import { GrafanaClientError } from './errors';
import { isGrafanaWriteMethod, isSafeGrafanaPath, validateRequestInput, type GrafanaRequestInput, type GrafanaRequestOptions } from './operations';

export { GrafanaClientError } from './errors';
export { isGrafanaWriteMethod, isSafeGrafanaPath } from './operations';
export type { GrafanaRequestInput, GrafanaRequestOptions };

export interface GrafanaClientOptions {
	baseUrl: string;
	accessToken?: string;
	username?: string;
	password?: string;
	headers?: Record<string, string>;
	fetch?: FetchLike;
	timeoutMs?: number;
	maxResponseBytes?: number;
}
export interface GrafanaRequestResult {
	status: number;
	data: unknown;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

function validInteger(value: unknown, fallback: number, name: string, max: number): number {
	const result = value === undefined ? fallback : value;
	if (typeof result !== 'number' || !Number.isSafeInteger(result) || result < 1 || result > max)
		throw new GrafanaClientError('INVALID_REQUEST', `Invalid Grafana ${name}`);
	return result;
}
function safeHeaderValues(headers: Record<string, string> | undefined): Headers {
	const result = new Headers(headers);
	for (const [key, value] of Object.entries(headers ?? {})) {
		if (typeof value !== 'string' || /[\r\n]/u.test(value) || (key.toLowerCase() === 'authorization' && !value.trim()))
			throw new Error();
	}
	return result;
}

/** Minimal Grafana HTTP client: health, whoAmI and a generic authenticated request passthrough. */
export class GrafanaClient {
	readonly type = 'grafana' as const;
	readonly baseUrl: string;
	readonly #fetch: FetchLike;
	readonly #headers: Headers;
	readonly #timeoutMs: number;
	readonly #maxResponseBytes: number;
	readonly #active = new Set<{ abort(): void; done: Promise<void> }>();
	#closed = false;
	#closePromise?: Promise<void>;

	constructor(options: GrafanaClientOptions) {
		try {
			const base = new URL(options.baseUrl);
			if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error();
			const hasToken = options.accessToken !== undefined;
			const hasBasic = options.username !== undefined || options.password !== undefined;
			if ((options.username !== undefined) !== (options.password !== undefined) || Number(hasToken) + Number(hasBasic) > 1) throw new Error();
			this.#headers = safeHeaderValues(options.headers);
			if ((hasToken || hasBasic) && this.#headers.has('authorization')) throw new Error();
			this.baseUrl = base.toString().replace(/\/+$/u, '');
			this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
			if (typeof this.#fetch !== 'function') throw new Error();
			if (hasToken) {
				if (typeof options.accessToken !== 'string' || !options.accessToken || /[\s\x00-\x1f\x7f]/u.test(options.accessToken)) throw new Error();
				this.#headers.set('authorization', `Bearer ${options.accessToken}`);
			} else if (hasBasic) {
				if (typeof options.username !== 'string' || typeof options.password !== 'string' || !options.username || options.username.includes(':') || /[\r\n]/u.test(options.username + options.password)) throw new Error();
				const bytes = new TextEncoder().encode(`${options.username}:${options.password}`);
				let binary = '';
				for (const byte of bytes) binary += String.fromCharCode(byte);
				this.#headers.set('authorization', `Basic ${btoa(binary)}`);
			}
			this.#headers.set('accept', this.#headers.get('accept') ?? 'application/json');
			this.#timeoutMs = validInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, 'timeout', 3_600_000);
			this.#maxResponseBytes = validInteger(options.maxResponseBytes, DEFAULT_MAX_RESPONSE_BYTES, 'response size', 64 * 1024 * 1024);
		} catch {
			throw new GrafanaClientError('INVALID_CONFIG', 'Invalid Grafana configuration');
		}
	}

	#url(path: string, params: Record<string, string | string[] | undefined>): URL {
		const url = new URL(`${this.baseUrl}${path}`);
		for (const [key, value] of Object.entries(params)) {
			if (value === undefined) continue;
			for (const item of Array.isArray(value) ? value : [value]) url.searchParams.append(key, item);
		}
		return url;
	}

	async #request(operation: string, method: string, path: string, params: Record<string, string | string[] | undefined>, body: unknown, options: GrafanaRequestOptions | undefined): Promise<GrafanaRequestResult> {
		if (this.#closed) throw new GrafanaClientError('CLOSED', 'Grafana client is closed');
		if (options?.signal?.aborted) throw new GrafanaClientError('ABORTED', 'Grafana request was aborted');
		const timeoutMs = Math.min(this.#timeoutMs, validInteger(options?.timeoutMs, this.#timeoutMs, 'timeout', 3_600_000));
		const controller = new AbortController();
		let response: Response | undefined;
		let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
		let cancellationStarted = false;
		let rejectAbort!: (reason: GrafanaClientError) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		let finished = false;
		const stop = (code: 'ABORTED' | 'TIMEOUT' | 'CLOSED') => {
			if (finished || controller.signal.aborted) return;
			const error = new GrafanaClientError(code, code === 'TIMEOUT' ? 'Grafana request timed out' : code === 'CLOSED' ? 'Grafana client is closed' : 'Grafana request was aborted');
			controller.abort(error);
			if (!cancellationStarted) {
				cancellationStarted = true;
				try {
					const pending = reader ? reader.cancel() : response?.body?.cancel();
					if (pending) void pending.catch(() => undefined);
				} catch { /* transport cleanup must not replace the fixed request error */ }
			}
			rejectAbort(error);
		};
		const active = { abort: () => stop('CLOSED'), done: Promise.resolve() };
		let finish!: () => void;
		active.done = new Promise<void>((resolve) => { finish = resolve; });
		this.#active.add(active);
		const callerAbort = () => stop('ABORTED');
		options?.signal?.addEventListener('abort', callerAbort, { once: true });
		const timer = setTimeout(() => stop('TIMEOUT'), timeoutMs);
		let payload: string | undefined;
		if (body !== undefined) {
			try {
				payload = JSON.stringify(body);
			} catch {
				throw new GrafanaClientError('INVALID_REQUEST', 'Grafana request body is not JSON serializable');
			}
			if (new TextEncoder().encode(payload).byteLength > this.#maxResponseBytes)
				throw new GrafanaClientError('INVALID_REQUEST', 'Grafana request body is too large');
		}
		try {
			const headers = new Headers(this.#headers);
			if (payload !== undefined) headers.set('content-type', 'application/json');
			response = await Promise.race([
				this.#fetch(this.#url(path, params), { method, headers, body: payload, signal: controller.signal }),
				aborted,
			]);
			const contentLength = response.headers.get('content-length');
			if (contentLength !== null && /^\d+$/u.test(contentLength) && Number(contentLength) > this.#maxResponseBytes)
				throw new GrafanaClientError('RESPONSE_TOO_LARGE', 'Grafana response is too large');
			reader = response.body?.getReader();
			const chunks: Uint8Array[] = [];
			let size = 0;
			if (reader) {
				let complete = false;
				try {
					while (true) {
						const chunk = await Promise.race([reader.read(), aborted]);
						if (chunk.done) break;
						size += chunk.value.byteLength;
						if (size > this.#maxResponseBytes) throw new GrafanaClientError('RESPONSE_TOO_LARGE', 'Grafana response is too large');
						chunks.push(chunk.value);
					}
					complete = true;
				} finally {
					if (!complete && !cancellationStarted) {
						cancellationStarted = true;
						try {
							const pending = reader.cancel();
							if (pending) void pending.catch(() => undefined);
						} catch { /* transport cleanup must not replace the fixed request error */ }
					}
					reader.releaseLock();
				}
			} else {
				const text = await Promise.race([response.text(), aborted]);
				size = new TextEncoder().encode(text).byteLength;
				if (size > this.#maxResponseBytes) throw new GrafanaClientError('RESPONSE_TOO_LARGE', 'Grafana response is too large');
				chunks.push(new TextEncoder().encode(text));
			}
			const bytes = new Uint8Array(size);
			let offset = 0;
			for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
			const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
			const contentType = response.headers.get('content-type') ?? '';
			let data: unknown = text;
			if (text && contentType.includes('json')) {
				try {
					data = JSON.parse(text);
				} catch {
					throw new GrafanaClientError('INVALID_RESPONSE', 'Grafana returned invalid JSON');
				}
			} else if (!text) {
				data = undefined;
			}
			if (!response.ok) throw new GrafanaClientError(response.status === 401 || response.status === 403 ? 'AUTH_FAILED' : 'REQUEST_FAILED', `Grafana ${operation} request failed`, response.status);
			return { status: response.status, data };
		} catch (error) {
			if (!cancellationStarted) {
				cancellationStarted = true;
				try {
					const pending = reader ? reader.cancel() : response?.body?.cancel();
					if (pending) void pending.catch(() => undefined);
				} catch { /* transport cleanup must not replace the fixed request error */ }
			}
			if (controller.signal.aborted && controller.signal.reason instanceof GrafanaClientError) throw controller.signal.reason;
			if (error instanceof GrafanaClientError) throw error;
			throw new GrafanaClientError('REQUEST_FAILED', `Grafana ${operation} request failed`);
		} finally {
			finished = true;
			clearTimeout(timer);
			options?.signal?.removeEventListener('abort', callerAbort);
			this.#active.delete(active);
			finish();
		}
	}

	async health(options?: GrafanaRequestOptions): Promise<unknown> {
		return (await this.#request('health', 'GET', '/api/health', {}, undefined, options)).data;
	}
	async whoAmI(options?: GrafanaRequestOptions): Promise<unknown> {
		return (await this.#request('whoAmI', 'GET', '/api/user', {}, undefined, options)).data;
	}
	async request(input: GrafanaRequestInput, options?: GrafanaRequestOptions): Promise<unknown> {
		const value = validateRequestInput(input);
		return (await this.#request('api', value.method, value.path, value.params, value.body, options)).data;
	}
	async close(): Promise<void> {
		if (this.#closePromise) return this.#closePromise;
		this.#closed = true;
		this.#closePromise = Promise.allSettled([...this.#active].map((entry) => { entry.abort(); return entry.done; })).then(() => undefined);
		return this.#closePromise;
	}
}

export { isGrafanaWriteMethod as isGrafanaApiWrite };
