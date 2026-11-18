import type { FetchLike } from '@wener/utils';
import { OpenObserveClientError } from './errors';
import { isReadOnlySQL } from './readonly';
import {
	ingestionRecords, ingestResult, mutationResult, ndjsonRecords, parseSettings, validateJson, validateOpenObserveStreamSettingsUpdate,
	type OpenObserveDeleteStreamInput, type OpenObserveGetValuesInput, type OpenObserveGetValuesResult,
	type OpenObserveHealthResult,
	type OpenObserveIngestJsonInput, type OpenObserveIngestMultiInput, type OpenObserveIngestResult,
	type OpenObserveMutationResult, type OpenObserveSearchAroundInput, type OpenObserveStreamInput,
	type OpenObserveStreamSettingsResult, type OpenObserveUpdateStreamSettingsInput,
} from './operations';

export { isReadOnlySQL } from './readonly';
export { OpenObserveClientError } from './errors';
export { validateOpenObserveStreamSettingsUpdate } from './operations';
export type {
	OpenObserveDeleteStreamInput, OpenObserveGetValuesInput, OpenObserveGetValuesResult,
	OpenObserveGetStreamSettingsInput, OpenObserveHealthResult,
	OpenObserveIngestJsonInput, OpenObserveIngestMultiInput, OpenObserveIngestResult,
	OpenObserveJsonObject, OpenObserveJsonValue, OpenObserveMutationResult, OpenObserveSearchAroundInput,
	OpenObserveSettingsUpdate, OpenObserveStreamInput, OpenObserveStreamPartition, OpenObserveStreamSettings,
	OpenObserveStreamSettingsResult, OpenObserveUpdateStreamSettings, OpenObserveUpdateStreamSettingsInput,
} from './operations';

export type OpenObserveStreamType = 'logs' | 'metrics' | 'traces';
export type OpenObserveSortBy = 'start_time' | 'duration';
export type OpenObserveSortOrder = 'asc' | 'desc';

export interface OpenObserveClientOptions {
	baseUrl: string;
	organization?: string;
	accessToken?: string;
	username?: string;
	password?: string;
	fetch?: FetchLike;
	timeoutMs?: number;
	maxResponseBytes?: number;
	headers?: Record<string, string>;
}
export interface OpenObserveRequestOptions {
	signal?: AbortSignal;
	timeoutMs?: number;
}
export interface OpenObserveStatus {
	reachable: boolean;
	readOnly: true;
	streamType: OpenObserveStreamType;
	authConfigured: boolean;
	endpointCount: number;
	latencyMs: number;
	checkedAt: string;
	error?: { code: string; message: string };
}
export interface OpenObserveStream {
	organization: string;
	name: string;
	streamType: string;
	documentCount?: number;
	storageBytes?: number;
	schemaFields: string[];
}
export interface OpenObserveListStreamInput {
	organization?: string;
	streamType?: OpenObserveStreamType;
	offset?: number;
	limit?: number;
	fetchSchema?: boolean;
	keyword?: string;
}
export interface OpenObserveListStreamResult {
	streams: OpenObserveStream[];
	total: number;
}
export interface OpenObserveGetStreamSchemaInput {
	organization?: string;
	stream: string;
	streamType?: OpenObserveStreamType;
	offset?: number;
	limit?: number;
	keyword?: string;
}
export interface OpenObserveSchemaField {
	name: string;
	type: string;
}
export interface OpenObserveStreamSchemaResult {
	organization: string;
	stream: string;
	streamType: string;
	fields: OpenObserveSchemaField[];
	totalFields: number;
}
export interface OpenObserveSearchInput {
	organization?: string;
	streamType?: OpenObserveStreamType;
	sql: string;
	startTimeMicros: number;
	endTimeMicros: number;
	from?: number;
	size?: number;
	timeoutSeconds?: number;
}
export interface OpenObserveSearchResult {
	streamType: OpenObserveStreamType;
	hits: unknown[];
	total: number;
	from: number;
	size: number;
	tookMs?: number;
	scanBytes?: number;
	isPartial: boolean;
	functionErrors: string[];
	traceId?: string;
}
export interface OpenObserveListTraceInput {
	organization?: string;
	stream: string;
	startTimeMicros: number;
	endTimeMicros: number;
	from?: number;
	size?: number;
	filter?: string;
	timeoutSeconds?: number;
	sortBy?: OpenObserveSortBy;
	sortOrder?: OpenObserveSortOrder;
}
export interface OpenObserveListTraceResult {
	streamType: 'traces';
	traces: unknown[];
	total: number;
	from: number;
	size: number;
	tookMs?: number;
	isPartial: boolean;
	functionErrors: string[];
	traceId?: string;
}
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
const DEFAULT_ORGANIZATION = 'default';
const STREAM_TYPES = new Set<OpenObserveStreamType>(['logs', 'metrics', 'traces']);

function integer(value: unknown, name: string, min: number, max: number): number {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max)
		throw new OpenObserveClientError('INVALID_REQUEST', `Invalid OpenObserve ${name}`);
	return value;
}
function optionalInteger(value: unknown, fallback: number, name: string, min: number, max: number): number {
	return integer(value === undefined ? fallback : value, name, min, max);
}
function streamType(value: unknown): OpenObserveStreamType {
	if (typeof value !== 'string' || !STREAM_TYPES.has(value as OpenObserveStreamType))
		throw new OpenObserveClientError('INVALID_REQUEST', 'Invalid OpenObserve stream type');
	return value as OpenObserveStreamType;
}
function text(value: unknown, name: string, max = 64 * 1024): string {
	if (typeof value !== 'string' || !value.trim() || new TextEncoder().encode(value).byteLength > max)
		throw new OpenObserveClientError('INVALID_REQUEST', `Invalid OpenObserve ${name}`);
	return value;
}
function identifier(value: unknown, name: string): string {
	const result = text(value, name, 256).trim();
	// WHATWG URL processing resolves even percent-encoded dot segments.
	if (result === '.' || result === '..' || /[\x00-\x1f\x7f]/u.test(result))
		throw new OpenObserveClientError('INVALID_REQUEST', `Invalid OpenObserve ${name}`);
	return result;
}
function filter(value: unknown, name: string, max: number): string | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== 'string' || new TextEncoder().encode(value).byteLength > max || /[\x00-\x1f\x7f]/u.test(value))
		throw new OpenObserveClientError('INVALID_REQUEST', `Invalid OpenObserve ${name}`);
	return value;
}
function requestInput(value: unknown): void {
	if (value === null || typeof value !== 'object' || Array.isArray(value))
		throw new OpenObserveClientError('INVALID_REQUEST', 'Invalid OpenObserve request');
}
function page(offset: unknown, limit: unknown, defaultLimit: number): [number, number] {
	const from = optionalInteger(offset, 0, 'offset', 0, 2_147_483_647);
	const size = optionalInteger(limit, defaultLimit, 'limit', 1, 1000);
	integer(from + size, 'page range', 1, 2_147_483_647);
	return [from, size];
}
function timeRange(start: unknown, end: unknown): [number, number] {
	const from = integer(start, 'start time', 0, Number.MAX_SAFE_INTEGER);
	const to = integer(end, 'end time', 0, Number.MAX_SAFE_INTEGER);
	if (to <= from || to - from > 86_400_000_000)
		throw new OpenObserveClientError('INVALID_REQUEST', 'OpenObserve end time must be after start time and within 24 hours');
	return [from, to];
}
function invalidResponse(): never {
	throw new OpenObserveClientError('INVALID_RESPONSE', 'OpenObserve returned an invalid response');
}
function record(value: unknown): Record<string, unknown> {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) invalidResponse();
	return value as Record<string, unknown>;
}
function list(value: unknown, maximum = 1000): unknown[] {
	if (!Array.isArray(value) || value.length > maximum) invalidResponse();
	return value;
}
function responseText(value: unknown): string {
	if (typeof value !== 'string' || !value.trim()) invalidResponse();
	return value;
}
function count(value: unknown, fallback: number): number {
	if (value === undefined) return fallback;
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) invalidResponse();
	return value;
}
function numberValue(value: unknown): number | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) invalidResponse();
	return value;
}
function byteSize(bytes: unknown, mebibytes: unknown): number | undefined {
	const explicit = numberValue(bytes);
	if (explicit !== undefined) return explicit;
	const size = numberValue(mebibytes);
	if (size === undefined) return undefined;
	// OpenObserve *_size fields are MiB. Round fractional MiB to the nearest byte.
	const converted = Math.round(size * 1024 * 1024);
	if (!Number.isSafeInteger(converted)) invalidResponse();
	return converted;
}
function schemaFields(value: unknown, limit: number): OpenObserveSchemaField[] {
	return list(value, limit).map((entry) => {
		const field = record(entry);
		return { name: responseText(field.name), type: responseText(field.type) };
	});
}
function queryResult(value: Record<string, unknown>, from: number, size: number, type: OpenObserveStreamType): OpenObserveSearchResult {
	const hits = list(value.hits, size);
	const responseFrom = count(value.from, from);
	const responseSize = count(value.size, size);
	if (responseFrom !== from || responseSize > size || hits.length > responseSize) invalidResponse();
	if (value.is_partial !== undefined && typeof value.is_partial !== 'boolean') invalidResponse();
	let errors: string[] = [];
	if (value.function_error !== undefined) {
		if (typeof value.function_error === 'string') errors = value.function_error ? [value.function_error] : [];
		else {
			if (!Array.isArray(value.function_error) || !value.function_error.every((entry) => typeof entry === 'string')) invalidResponse();
			errors = value.function_error.filter(Boolean);
		}
	}
	if (value.trace_id !== undefined && typeof value.trace_id !== 'string') invalidResponse();
	return {
		streamType: type, hits, total: count(value.total, hits.length), from: responseFrom, size: responseSize,
		tookMs: numberValue(value.took), scanBytes: byteSize(value.scan_bytes, value.scan_size),
		isPartial: value.is_partial === true || errors.length > 0,
		functionErrors: errors.length ? ['OpenObserve reported a partial query error'] : [],
		traceId: typeof value.trace_id === 'string' ? value.trace_id.slice(0, 256) : undefined,
	};
}

export class OpenObserveClient implements AsyncDisposable {
	readonly type = 'openobserve' as const;
	/** Compatibility metadata. Hosts must separately authorize access to the write methods. */
	readonly readOnly = true as const;
	readonly baseUrl: string;
	readonly organization: string;
	readonly #fetch: FetchLike;
	readonly #authorization?: string;
	readonly #timeoutMs: number;
	readonly #maxResponseBytes: number;
	readonly #headers: Headers;
	#closed = false;
	#closePromise?: Promise<void>;
	readonly #active = new Set<{ abort(): void; done: Promise<void> }>();
	constructor(options: OpenObserveClientOptions) {
		try {
			const url = new URL(options.baseUrl);
			if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.href.includes('?') || url.href.includes('#'))
				throw new Error();
			const hasToken = options.accessToken !== undefined;
			const hasBasic = options.username !== undefined || options.password !== undefined;
			this.#headers = new Headers(options.headers);
			// Headers also validates names and rejects embedded CR/LF in every value.
			for (const [key, value] of Object.entries(options.headers ?? {})) {
				if (typeof value !== 'string' || /[\r\n]/u.test(value)) throw new Error();
				if (key.toLowerCase() === 'authorization' && !value.trim()) throw new Error();
			}
			const headerAuth = this.#headers.has('authorization');
			if (Object.keys(options.headers ?? {}).filter((key) => key.toLowerCase() === 'authorization').length > 1) throw new Error();
			if (Number(hasToken) + Number(hasBasic) + Number(headerAuth) !== 1) throw new Error();
			if ((options.username !== undefined) !== (options.password !== undefined)) throw new Error();
			this.baseUrl = url.toString().replace(/\/$/u, '');
			this.organization = identifier(options.organization === undefined ? DEFAULT_ORGANIZATION : options.organization, 'organization');
			this.#fetch = options.fetch ?? globalThis.fetch;
			if (typeof this.#fetch !== 'function') throw new Error();
			if (hasToken) {
				const token = text(options.accessToken, 'access token');
				if (/[\s\x00-\x1f\x7f]/u.test(token)) throw new Error();
				this.#authorization = `Bearer ${token}`;
			} else if (hasBasic) {
				const username = text(options.username, 'username');
				if (typeof options.password !== 'string' || username.includes(':') || /[\r\n]/u.test(username + options.password)) throw new Error();
				const bytes = new TextEncoder().encode(`${username}:${options.password}`);
				let binary = '';
				for (const byte of bytes) binary += String.fromCharCode(byte);
				this.#authorization = `Basic ${btoa(binary)}`;
			} else this.#authorization = this.#headers.get('authorization')!;
			if (this.#authorization) this.#headers.set('authorization', this.#authorization);
			this.#timeoutMs = optionalInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, 'timeout', 1, 3_600_000);
			this.#maxResponseBytes =
				optionalInteger(options.maxResponseBytes, DEFAULT_MAX_RESPONSE_BYTES, 'response size', 1, 64 * 1024 * 1024);
		} catch {
			throw new OpenObserveClientError('INVALID_CONFIG', 'Invalid OpenObserve configuration');
		}
	}
	#available(options?: OpenObserveRequestOptions): void {
		if (this.#closed) throw new OpenObserveClientError('CLOSED', 'OpenObserve client is closed');
		if (options !== undefined) {
			requestInput(options);
			if (options.signal !== undefined && (!options.signal || typeof options.signal.aborted !== 'boolean' || typeof options.signal.addEventListener !== 'function' || typeof options.signal.removeEventListener !== 'function'))
				throw new OpenObserveClientError('INVALID_REQUEST', 'Invalid OpenObserve signal');
		}
		if (options?.signal?.aborted) throw new OpenObserveClientError('ABORTED', 'OpenObserve request was aborted');
	}
	async #request<T>(
		operation: string,
		path: string,
		init: {
			method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
			query?: Record<string, string | number | boolean | undefined>;
			body?: unknown;
			ndjson?: string;
		} = {},
		options: OpenObserveRequestOptions = {},
		parse: (value: Record<string, unknown>) => T,
	): Promise<T> {
		this.#available(options);
		const url = new URL(`${this.baseUrl}${path}`);
		for (const [key, value] of Object.entries(init.query ?? {}))
			if (value !== undefined) url.searchParams.set(key, String(value));
		let body: string | undefined = init.ndjson;
		if (init.body !== undefined) {
			try {
				body = JSON.stringify(init.body);
			} catch {
				throw new OpenObserveClientError('INVALID_REQUEST', 'OpenObserve request is not JSON serializable');
			}
		}
		if (body !== undefined && new TextEncoder().encode(body).byteLength > 1024 * 1024)
			throw new OpenObserveClientError('INVALID_REQUEST', 'OpenObserve request is too large');
		const controller = new AbortController();
		const timeoutMs = Math.min(this.#timeoutMs, optionalInteger(options.timeoutMs, this.#timeoutMs, 'timeout', 1, 3_600_000));
		const deadline = performance.now() + timeoutMs;
		let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
		let response: Response | undefined;
		let consumed = false;
		let cancellationStarted = false;
		const cancelBody = () => {
			if (cancellationStarted || consumed || (!reader && !response?.body)) return;
			cancellationStarted = true;
			try {
				const result = reader ? reader.cancel() : response?.body?.cancel();
				// Transport cleanup is best effort and must not hold the request or close() open.
				if (result) void result.catch(() => undefined);
			} catch { /* cancellation must not replace the safe request error */ }
		};
		let rejectAbort!: (error: OpenObserveClientError) => void;
		const aborted = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		// The race settles even if a custom fetch or a pending read ignores AbortSignal.
		const stop = (code: 'ABORTED' | 'TIMEOUT' | 'CLOSED') => {
			if (controller.signal.aborted) return;
			const error = new OpenObserveClientError(code, code === 'TIMEOUT' ? 'OpenObserve request timed out' : code === 'CLOSED' ? 'OpenObserve client is closed' : 'OpenObserve request was aborted');
			controller.abort(error);
			cancelBody();
			rejectAbort(error);
		};
		const checkpoint = () => {
			if (!controller.signal.aborted && performance.now() >= deadline) stop('TIMEOUT');
			if (controller.signal.aborted) throw controller.signal.reason;
		};
		const race = <V>(promise: Promise<V>): Promise<V> => Promise.race([promise, aborted]);
		let finish!: () => void;
		const active = { abort: () => stop('CLOSED'), done: new Promise<void>((resolve) => { finish = resolve; }) };
		this.#active.add(active);
		const callerAbort = () => stop('ABORTED');
		options.signal?.addEventListener('abort', callerAbort, { once: true });
		const timer = setTimeout(() => stop('TIMEOUT'), timeoutMs);
		try {
			if (options.signal?.aborted) stop('ABORTED');
			checkpoint();
			const headers = new Headers(this.#headers);
			if (!headers.has('accept')) headers.set('accept', 'application/json');
			if (body !== undefined) headers.set('content-type', init.ndjson === undefined ? 'application/json' : 'application/x-ndjson');
			const fetching = this.#fetch(url, {
				method: init.method ?? 'GET',
				headers,
				body,
				signal: controller.signal,
			}).then((result) => {
				// A signal-ignoring transport may deliver its response after the request settled.
				if (controller.signal.aborted) {
					try { void result.body?.cancel().catch(() => undefined); } catch { /* already closed */ }
				}
				return result;
			});
			response = await race(fetching);
			checkpoint();
			if (!response.ok)
				throw new OpenObserveClientError(
					response.status === 401 || response.status === 403 ? 'AUTH_FAILED' : 'REQUEST_FAILED',
					`OpenObserve ${operation} failed`,
					response.status,
				);
			const length = response.headers.get('content-length');
			if (length !== null && !/^\d+$/u.test(length)) invalidResponse();
			if (length !== null && Number(length) > this.#maxResponseBytes)
				throw new OpenObserveClientError('RESPONSE_TOO_LARGE', 'OpenObserve response is too large');
			const chunks: Uint8Array[] = [];
			let size = 0;
			if (response.body) {
				reader = response.body.getReader();
				while (true) {
					checkpoint();
					const chunk = await race(reader.read());
					checkpoint();
					if (chunk.done) break;
					size += chunk.value.byteLength;
					if (size > this.#maxResponseBytes) throw new OpenObserveClientError('RESPONSE_TOO_LARGE', 'OpenObserve response is too large');
					chunks.push(chunk.value);
				}
			}
			consumed = true;
			const bytes = new Uint8Array(size);
			let offset = 0;
			for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
			let value: unknown;
			try {
				value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
			} catch {
				throw new OpenObserveClientError('INVALID_RESPONSE', 'OpenObserve returned invalid JSON');
			}
			checkpoint();
			const result = parse(record(value));
			checkpoint();
			return result;
		} catch (error) {
			checkpoint();
			throw error instanceof OpenObserveClientError ? error : new OpenObserveClientError('REQUEST_FAILED', 'OpenObserve request failed');
		} finally {
			clearTimeout(timer);
			options.signal?.removeEventListener('abort', callerAbort);
			if (!consumed) cancelBody();
			try { reader?.releaseLock(); } finally {
				this.#active.delete(active);
				finish();
			}
		}
	}
	#org(input?: string): string {
		return identifier(input === undefined ? this.organization : input, 'organization');
	}
	#type(input?: OpenObserveStreamType): OpenObserveStreamType {
		return streamType(input === undefined ? 'logs' : input);
	}
	#queryOptions(timeout: number | undefined, options?: OpenObserveRequestOptions): OpenObserveRequestOptions {
		const httpTimeout = optionalInteger(options?.timeoutMs, this.#timeoutMs, 'timeout', 1, 3_600_000);
		return { ...options, timeoutMs: Math.min(this.#timeoutMs, httpTimeout, timeout === undefined ? Infinity : timeout * 1000) };
	}
	/** Validated health endpoint, without the authenticated stream-list probe performed by status(). */
	health(options?: OpenObserveRequestOptions): Promise<OpenObserveHealthResult> {
		return this.#request('health', '/healthz', {}, options, (value) => {
			if (value.status !== 'ok') invalidResponse();
			return { status: 'ok' };
		});
	}
	async getStreamSettings(input: OpenObserveStreamInput, options?: OpenObserveRequestOptions): Promise<OpenObserveStreamSettingsResult> {
		this.#available(options);
		requestInput(input);
		const organization = this.#org(input.organization);
		const stream = identifier(input.stream, 'stream');
		const type = this.#type(input.streamType);
		return this.#request('get stream settings', `/api/${encodeURIComponent(organization)}/streams/${encodeURIComponent(stream)}/schema`, { query: { type } }, options, (value) => ({
			organization, stream, streamType: type, settings: parseSettings(value.settings, false),
		}));
	}
	async updateStreamSettings(input: OpenObserveUpdateStreamSettingsInput, options?: OpenObserveRequestOptions): Promise<OpenObserveMutationResult> {
		this.#available(options);
		requestInput(input);
		const organization = this.#org(input.organization);
		const stream = identifier(input.stream, 'stream');
		const type = this.#type(input.streamType);
		const settings = validateOpenObserveStreamSettingsUpdate(input.settings);
		return this.#request('update stream settings', `/api/${encodeURIComponent(organization)}/streams/${encodeURIComponent(stream)}/settings`, { method: 'PUT', query: { type }, body: settings }, options, mutationResult);
	}
	async deleteStream(input: OpenObserveDeleteStreamInput, options?: OpenObserveRequestOptions): Promise<OpenObserveMutationResult> {
		this.#available(options);
		requestInput(input);
		const organization = this.#org(input.organization);
		const stream = identifier(input.stream, 'stream');
		const type = this.#type(input.streamType);
		if (input.deleteAll !== undefined && typeof input.deleteAll !== 'boolean') throw new OpenObserveClientError('INVALID_REQUEST', 'Invalid OpenObserve delete flag');
		return this.#request('delete stream', `/api/${encodeURIComponent(organization)}/streams/${encodeURIComponent(stream)}`, { method: 'DELETE', query: { type, delete_all: input.deleteAll === undefined ? false : input.deleteAll } }, options, mutationResult);
	}
	async ingestJson(input: OpenObserveIngestJsonInput, options?: OpenObserveRequestOptions): Promise<OpenObserveIngestResult> {
		this.#available(options);
		requestInput(input);
		const organization = this.#org(input.organization);
		const stream = identifier(input.stream, 'stream');
		const records = ingestionRecords(input.records);
		return this.#request('ingest JSON', `/api/${encodeURIComponent(organization)}/${encodeURIComponent(stream)}/_json`, { method: 'POST', body: records }, options, ingestResult);
	}
	async ingestMulti(input: OpenObserveIngestMultiInput, options?: OpenObserveRequestOptions): Promise<OpenObserveIngestResult> {
		this.#available(options);
		requestInput(input);
		const organization = this.#org(input.organization);
		const stream = identifier(input.stream, 'stream');
		const ndjson = ndjsonRecords(input.records);
		return this.#request('ingest NDJSON', `/api/${encodeURIComponent(organization)}/${encodeURIComponent(stream)}/_multi`, { method: 'POST', ndjson }, options, ingestResult);
	}
	async getValues(input: OpenObserveGetValuesInput, options?: OpenObserveRequestOptions): Promise<OpenObserveGetValuesResult> {
		this.#available(options);
		requestInput(input);
		const organization = this.#org(input.organization);
		const stream = identifier(input.stream, 'stream');
		const type = this.#type(input.streamType);
		const [start, end] = timeRange(input.startTimeMicros, input.endTimeMicros);
		const size = optionalInteger(input.size, 10, 'size', 1, 1000);
		if (!Array.isArray(input.fields) || !input.fields.length || input.fields.length > 100) throw new OpenObserveClientError('INVALID_REQUEST', 'Invalid OpenObserve fields');
		const fields = input.fields.map((field) => {
			const name = identifier(field, 'field');
			if (name.includes(',')) throw new OpenObserveClientError('INVALID_REQUEST', 'Invalid OpenObserve field');
			return name;
		});
		const keyword = filter(input.keyword, 'keyword', 256);
		if (input.noCount !== undefined && typeof input.noCount !== 'boolean') throw new OpenObserveClientError('INVALID_REQUEST', 'Invalid OpenObserve count flag');
		return this.#request('get values', `/api/${encodeURIComponent(organization)}/${encodeURIComponent(stream)}/_values`, { query: { type, fields: fields.join(','), start_time: start, end_time: end, size, keyword, no_count: input.noCount } }, options, (value) => {
			if (count(value.from, 0) !== 0 || count(value.size, 0) > size) invalidResponse();
			const hits = list(value.hits, fields.length).map((entry) => {
				const row = record(entry);
				const field = responseText(row.field);
				if (!fields.includes(field)) invalidResponse();
				const values = list(row.values, size).map((item) => {
					const result = record(item);
					validateJson(result.zo_sql_key, true);
					return { zo_sql_key: result.zo_sql_key, ...(result.zo_sql_num === undefined ? {} : { zo_sql_num: count(result.zo_sql_num, 0) }) };
				});
				return { field, values };
			});
			return { hits, total: count(value.total, hits.length), tookMs: numberValue(value.took), scanBytes: byteSize(value.scan_bytes, value.scan_size) };
		});
	}
	async searchAround(input: OpenObserveSearchAroundInput, options?: OpenObserveRequestOptions): Promise<OpenObserveSearchResult> {
		this.#available(options);
		requestInput(input);
		const organization = this.#org(input.organization);
		const stream = identifier(input.stream, 'stream');
		const type = this.#type(input.streamType);
		const key = integer(input.key, 'timestamp', 0, Number.MAX_SAFE_INTEGER);
		const size = optionalInteger(input.size, 10, 'size', 1, 1000);
		return this.#request('search around', `/api/${encodeURIComponent(organization)}/${encodeURIComponent(stream)}/_around`, { query: { type, key, size } }, options, (value) => {
			// _around documents size=0 in responses, even when hits are returned.
			if (count(value.size, 0) > size) invalidResponse();
			return queryResult({ ...value, size }, 0, size, type);
		});
	}
	async status(
		input: { organization?: string; streamType?: OpenObserveStreamType } = {},
		options?: OpenObserveRequestOptions,
	): Promise<OpenObserveStatus> {
		this.#available(options);
		requestInput(input);
		const type = this.#type(input.streamType);
		const organization = this.#org(input.organization);
		const start = performance.now();
		try {
			await this.#request('status', '/healthz', {}, options, (value) => { if (value.status !== 'ok') invalidResponse(); });
			await this.listStreams({ organization, streamType: type, limit: 1, fetchSchema: false }, options);
			this.#available(options);
			return {
				reachable: true,
				readOnly: true,
				streamType: type,
				authConfigured: Boolean(this.#authorization),
				endpointCount: 2,
				latencyMs: performance.now() - start,
				checkedAt: new Date().toISOString(),
			};
		} catch (error) {
			if (error instanceof OpenObserveClientError && ['ABORTED', 'CLOSED', 'INVALID_REQUEST'].includes(error.code)) throw error;
			return {
				reachable: false,
				readOnly: true,
				streamType: type,
				authConfigured: Boolean(this.#authorization),
				endpointCount: 2,
				latencyMs: performance.now() - start,
				checkedAt: new Date().toISOString(),
				error: {
					code: error instanceof OpenObserveClientError ? error.code : 'REQUEST_FAILED',
					message: 'OpenObserve status check failed',
				},
			};
		}
	}
	async listStreams(
		input: OpenObserveListStreamInput = {},
		options?: OpenObserveRequestOptions,
	): Promise<OpenObserveListStreamResult> {
		this.#available(options);
		requestInput(input);
		const type = this.#type(input.streamType);
		const organization = this.#org(input.organization);
		const [offset, limit] = page(input.offset, input.limit, 100);
		const keyword = filter(input.keyword, 'keyword', 256);
		if (input.fetchSchema !== undefined && typeof input.fetchSchema !== 'boolean') throw new OpenObserveClientError('INVALID_REQUEST', 'Invalid OpenObserve schema flag');
		return this.#request(
			'list streams',
			`/api/${encodeURIComponent(organization)}/streams`,
			{ query: { type, offset, limit, fetchSchema: input.fetchSchema, keyword } },
			options,
			(value) => {
				const streams = list(value.list ?? value.streams, limit).map((entry) => {
					const row = record(entry);
					const stats = row.stats === undefined ? {} : record(row.stats);
					return {
						organization, name: responseText(row.name), streamType: responseText(row.stream_type ?? row.streamType),
						documentCount: numberValue(stats.doc_num ?? row.doc_num ?? row.document_count),
						storageBytes: byteSize(stats.storage_bytes ?? row.storage_bytes, stats.storage_size ?? row.storage_size),
						schemaFields: row.schema === undefined ? [] : schemaFields(row.schema, 1000).map((field) => field.name),
					};
				});
				return { streams, total: count(value.total, streams.length) };
			},
		);
	}
	async getStreamSchema(
		input: OpenObserveGetStreamSchemaInput,
		options?: OpenObserveRequestOptions,
	): Promise<OpenObserveStreamSchemaResult> {
		this.#available(options);
		requestInput(input);
		const stream = identifier(input.stream, 'stream');
		const type = this.#type(input.streamType);
		const organization = this.#org(input.organization);
		const [offset, limit] = page(input.offset, input.limit, 200);
		const keyword = filter(input.keyword, 'keyword', 256);
		return this.#request(
			'get stream schema',
			`/api/${encodeURIComponent(organization)}/streams/${encodeURIComponent(stream)}/schema`,
			{ query: { type, offset, limit, keyword } },
			options,
			(value) => {
				const fields = schemaFields(value.schema ?? value.fields, limit);
				return {
					organization, stream, streamType: value.stream_type === undefined ? type : responseText(value.stream_type),
					fields, totalFields: count(value.total_fields ?? value.total, fields.length),
				};
			},
		);
	}
	async search(input: OpenObserveSearchInput, options?: OpenObserveRequestOptions): Promise<OpenObserveSearchResult> {
		this.#available(options);
		requestInput(input);
		const type = this.#type(input.streamType);
		const sql = text(input.sql, 'SQL');
		if (!isReadOnlySQL(sql)) throw new OpenObserveClientError('INVALID_REQUEST', 'OpenObserve search requires one read-only SQL query');
		const [start, end] = timeRange(input.startTimeMicros, input.endTimeMicros);
		const [from, size] = page(input.from, input.size, 100);
		const timeout = input.timeoutSeconds === undefined ? undefined : integer(input.timeoutSeconds, 'timeout', 1, 60);
		const requestOptions = this.#queryOptions(timeout, options);
		const serverTimeout = timeout === undefined ? undefined : Math.min(timeout, Math.max(1, Math.floor(requestOptions.timeoutMs! / 1000)));
		return this.#request(
			'search',
			`/api/${encodeURIComponent(this.#org(input.organization))}/_search`,
			{
				method: 'POST',
				query: { type },
				body: { query: { sql, start_time: start, end_time: end, from, size }, timeout: serverTimeout },
			},
			requestOptions,
			(value) => queryResult(value, from, size, type),
		);
	}
	async listTraces(
		input: OpenObserveListTraceInput,
		options?: OpenObserveRequestOptions,
	): Promise<OpenObserveListTraceResult> {
		this.#available(options);
		requestInput(input);
		const stream = identifier(input.stream, 'trace stream');
		const [start, end] = timeRange(input.startTimeMicros, input.endTimeMicros);
		const [from, size] = page(input.from, input.size, 100);
		const timeout = input.timeoutSeconds === undefined ? undefined : integer(input.timeoutSeconds, 'timeout', 1, 60);
		const requestOptions = this.#queryOptions(timeout, options);
		const serverTimeout = timeout === undefined ? undefined : Math.min(timeout, Math.max(1, Math.floor(requestOptions.timeoutMs! / 1000)));
		const traceFilter = filter(input.filter, 'trace filter', 8192);
		if (input.sortBy !== undefined && !['start_time', 'duration'].includes(input.sortBy)) throw new OpenObserveClientError('INVALID_REQUEST', 'Invalid OpenObserve trace sort field');
		if (input.sortOrder !== undefined && !['asc', 'desc'].includes(input.sortOrder)) throw new OpenObserveClientError('INVALID_REQUEST', 'Invalid OpenObserve trace sort order');
		return this.#request(
			'list traces',
			`/api/${encodeURIComponent(this.#org(input.organization))}/${encodeURIComponent(stream)}/traces/latest`,
			{
				query: {
					type: 'traces',
					start_time: start,
					end_time: end,
					from,
					size,
					timeout: serverTimeout,
					filter: traceFilter,
					sort_by: input.sortBy,
					sort_order: input.sortOrder,
				},
			},
			requestOptions,
			(value) => {
				const result = queryResult(value, from, size, 'traces');
				return {
					streamType: 'traces', traces: result.hits, total: result.total, from: result.from, size: result.size,
					tookMs: result.tookMs, isPartial: result.isPartial, functionErrors: result.functionErrors, traceId: result.traceId,
				};
			},
		);
	}
	close(): Promise<void> {
		if (!this.#closePromise) {
			this.#closed = true;
			const requests = [...this.#active];
			for (const request of requests) request.abort();
			this.#closePromise = Promise.all(requests.map((request) => request.done)).then(() => undefined);
		}
		return this.#closePromise;
	}
	[Symbol.asyncDispose](): Promise<void> {
		return this.close();
	}
}
