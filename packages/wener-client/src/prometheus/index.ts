import type { FetchLike } from '@wener/utils';
import { PrometheusClientError } from './errors';
import {
	parseLabelValuesEnvelope,
	parseMetadataEnvelope,
	parseQueryEnvelope,
	parseSeriesEnvelope,
	validateLabelValuesInput,
	validateLabelsInput,
	validateMetadataInput,
	validateQueryInput,
	validateQueryRangeInput,
	validateSeriesInput,
	type PrometheusLabelsInput,
	type PrometheusLabelValuesInput,
	type PrometheusMetadataInput,
	type PrometheusMetadataResponse,
	type PrometheusLabelValuesResponse,
	type PrometheusQueryInput,
	type PrometheusQueryRangeInput,
	type PrometheusQueryResponse,
	type PrometheusSeriesInput,
	type PrometheusSeriesResponse,
} from './operations';

export * from './errors';
export * from './operations';

export interface PrometheusClientOptions {
	baseUrl: string;
	apiPrefix?: string;
	accessToken?: string;
	username?: string;
	password?: string;
	headers?: Record<string, string>;
	fetch?: FetchLike;
	timeoutMs?: number;
	maxResponseBytes?: number;
}
export interface PrometheusRequestOptions { signal?: AbortSignal; timeoutMs?: number }

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

function validInteger(value: unknown, fallback: number, name: string, max: number): number {
	const result = value === undefined ? fallback : value;
	if (typeof result !== 'number' || !Number.isSafeInteger(result) || result < 1 || result > max)
		throw new PrometheusClientError('INVALID_REQUEST', `Invalid Prometheus ${name}`);
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

export class PrometheusClient {
	readonly type = 'prometheus' as const;
	readonly readOnly = true as const;
	readonly baseUrl: string;
	readonly apiPrefix: string;
	readonly #fetch: FetchLike;
	readonly #headers: Headers;
	readonly #timeoutMs: number;
	readonly #maxResponseBytes: number;
	readonly #active = new Set<{ abort(): void; done: Promise<void> }>();
	#closed = false;
	#closePromise?: Promise<void>;

	constructor(options: PrometheusClientOptions) {
		try {
			const base = new URL(options.baseUrl);
			if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error();
			const prefix = options.apiPrefix ?? '/api/v1';
			if (!prefix.startsWith('/') || prefix.includes('?') || prefix.includes('#') || /[\x00-\x1f\x7f]/u.test(prefix)) throw new Error();
			const normalizedPrefix = prefix.replace(/^\/+|\/+$/gu, '');
			if (!normalizedPrefix) throw new Error();
			const hasToken = options.accessToken !== undefined;
			const hasBasic = options.username !== undefined || options.password !== undefined;
			if ((options.username !== undefined) !== (options.password !== undefined) || Number(hasToken) + Number(hasBasic) > 1) throw new Error();
			this.#headers = safeHeaderValues(options.headers);
			if ((hasToken || hasBasic) && this.#headers.has('authorization')) throw new Error();
			this.baseUrl = base.toString().replace(/\/+$/u, '');
			this.apiPrefix = `/${normalizedPrefix}`;
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
			this.#timeoutMs = validInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, 'timeout', 3_600_000);
			this.#maxResponseBytes = validInteger(options.maxResponseBytes, DEFAULT_MAX_RESPONSE_BYTES, 'response size', 64 * 1024 * 1024);
		} catch {
			throw new PrometheusClientError('INVALID_CONFIG', 'Invalid Prometheus configuration');
		}
	}

	#url(path: string, query: Record<string, string | string[] | undefined>): URL {
		const url = new URL(`${this.baseUrl}${this.apiPrefix}${path}`);
		for (const [key, value] of Object.entries(query)) {
			if (value === undefined) continue;
			for (const item of Array.isArray(value) ? value : [value]) url.searchParams.append(key, item);
		}
		return url;
	}

	async #request<T>(operation: string, path: string, query: Record<string, string | string[] | undefined>, options: PrometheusRequestOptions | undefined, parse: (value: unknown) => T): Promise<T> {
		if (this.#closed) throw new PrometheusClientError('CLOSED', 'Prometheus client is closed');
		if (options?.signal?.aborted) throw new PrometheusClientError('ABORTED', 'Prometheus request was aborted');
		const timeoutMs = Math.min(this.#timeoutMs, validInteger(options?.timeoutMs, this.#timeoutMs, 'timeout', 3_600_000));
		const controller = new AbortController();
		let response: Response | undefined;
		let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
		let cancellationStarted = false;
		let rejectAbort!: (reason: PrometheusClientError) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		let finished = false;
		const stop = (code: 'ABORTED' | 'TIMEOUT' | 'CLOSED') => {
			if (finished || controller.signal.aborted) return;
			const error = new PrometheusClientError(code, code === 'TIMEOUT' ? 'Prometheus request timed out' : code === 'CLOSED' ? 'Prometheus client is closed' : 'Prometheus request was aborted');
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
		try {
			response = await Promise.race([this.#fetch(this.#url(path, query), { method: 'GET', headers: new Headers(this.#headers), signal: controller.signal }), aborted]);
			if (!response.ok) throw new PrometheusClientError(response.status === 401 || response.status === 403 ? 'AUTH_FAILED' : 'REQUEST_FAILED', `Prometheus ${operation} request failed`, response.status);
			const contentLength = response.headers.get('content-length');
			if (contentLength !== null && /^\d+$/u.test(contentLength) && Number(contentLength) > this.#maxResponseBytes)
				throw new PrometheusClientError('RESPONSE_TOO_LARGE', 'Prometheus response is too large');
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
						if (size > this.#maxResponseBytes) throw new PrometheusClientError('RESPONSE_TOO_LARGE', 'Prometheus response is too large');
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
				if (size > this.#maxResponseBytes) throw new PrometheusClientError('RESPONSE_TOO_LARGE', 'Prometheus response is too large');
				chunks.push(new TextEncoder().encode(text));
			}
			let value: unknown;
			try {
				const bytes = new Uint8Array(size);
				let offset = 0;
				for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
				value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
			} catch {
				throw new PrometheusClientError('INVALID_RESPONSE', 'Prometheus returned invalid JSON');
			}
			return parse(value);
		} catch (error) {
			if (!cancellationStarted) {
				cancellationStarted = true;
				try {
					const pending = reader ? reader.cancel() : response?.body?.cancel();
					if (pending) void pending.catch(() => undefined);
				} catch { /* transport cleanup must not replace the fixed request error */ }
			}
			if (controller.signal.aborted && controller.signal.reason instanceof PrometheusClientError) throw controller.signal.reason;
			if (error instanceof PrometheusClientError) throw error;
			throw new PrometheusClientError('REQUEST_FAILED', `Prometheus ${operation} request failed`);
		} finally {
			finished = true;
			clearTimeout(timer);
			options?.signal?.removeEventListener('abort', callerAbort);
			this.#active.delete(active);
			finish();
		}
	}

	query(input: PrometheusQueryInput, options?: PrometheusRequestOptions): Promise<PrometheusQueryResponse> {
		return this.#request('query', '/query', validateQueryInput(input), options, parseQueryEnvelope);
	}
	queryRange(input: PrometheusQueryRangeInput, options?: PrometheusRequestOptions): Promise<PrometheusQueryResponse> {
		return this.#request('query range', '/query_range', validateQueryRangeInput(input), options, parseQueryEnvelope);
	}
	series(input: PrometheusSeriesInput, options?: PrometheusRequestOptions): Promise<PrometheusSeriesResponse> {
		return this.#request('series', '/series', validateSeriesInput(input), options, parseSeriesEnvelope);
	}
	labels(input: PrometheusLabelsInput = {}, options?: PrometheusRequestOptions): Promise<PrometheusLabelValuesResponse> {
		return this.#request('labels', '/labels', validateLabelsInput(input), options, parseLabelValuesEnvelope);
	}
	labelValues(input: PrometheusLabelValuesInput, options?: PrometheusRequestOptions): Promise<PrometheusLabelValuesResponse> {
		return this.#request('label values', `/label/${encodeURIComponent(input.label)}/values`, validateLabelValuesInput(input), options, parseLabelValuesEnvelope);
	}
	metadata(input: PrometheusMetadataInput = {}, options?: PrometheusRequestOptions): Promise<PrometheusMetadataResponse> {
		return this.#request('metadata', '/metadata', validateMetadataInput(input), options, parseMetadataEnvelope);
	}
	async close(): Promise<void> {
		if (this.#closePromise) return this.#closePromise;
		this.#closed = true;
		this.#closePromise = Promise.allSettled([...this.#active].map((entry) => { entry.abort(); return entry.done; })).then(() => undefined);
		return this.#closePromise;
	}
}
