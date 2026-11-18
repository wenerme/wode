import type { FetchLike } from '@wener/utils';

export const DefaultCloudflareApiUrl = 'https://api.cloudflare.com/client/v4';
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 3_600_000;
const CONTROL = /[\x00-\x1f\x7f]/u;

export type CloudflareClientErrorCode =
	| 'INVALID_CONFIG'
	| 'INVALID_REQUEST'
	| 'INVALID_RESPONSE'
	| 'AUTH_FAILED'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'RATE_LIMITED'
	| 'REQUEST_FAILED'
	| 'TIMEOUT'
	| 'ABORTED'
	| 'CLOSED';

/** Cloudflare API error codes/messages from the response envelope; never request headers or the token. */
export interface CloudflareApiErrorItem { code?: number; message?: string }

/** Errors never contain the API token or request headers. */
export class CloudflareClientError extends Error {
	readonly code: CloudflareClientErrorCode;
	readonly status?: number;
	readonly errors?: CloudflareApiErrorItem[];
	constructor(code: CloudflareClientErrorCode, message: string, status?: number, errors?: CloudflareApiErrorItem[]) {
		super(message);
		this.name = 'CloudflareClientError';
		this.code = code;
		this.status = status;
		if (errors?.length) this.errors = errors;
	}
}

export interface CloudflareClientOptions {
	apiToken: string;
	/** Defaults to {@link DefaultCloudflareApiUrl}. */
	baseUrl?: string;
	fetch?: FetchLike;
	/** Per-request timeout; `0` disables it when the caller owns a deadline. Default 30000. */
	timeoutMs?: number;
}
export interface CloudflareRequestOptions { signal?: AbortSignal; timeoutMs?: number }
export interface CloudflarePreparedRequest {
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	path: string;
	query?: Record<string, string | number | boolean | undefined>;
	body?: unknown;
}
export interface CloudflareResultInfo { page?: number; per_page?: number; count?: number; total_count?: number; total_pages?: number }
export interface CloudflarePage<T> { result: T[]; resultInfo?: CloudflareResultInfo }

export interface CloudflareZone {
	id: string;
	name: string;
	status?: string;
	type?: string;
	paused?: boolean;
	name_servers?: string[];
	account?: { id?: string; name?: string };
	[key: string]: unknown;
}
export interface CloudflareDnsRecord {
	id: string;
	name: string;
	type: string;
	content?: string;
	ttl: number;
	proxied?: boolean;
	proxiable?: boolean;
	priority?: number;
	data?: Record<string, unknown>;
	comment?: string | null;
	tags?: string[];
	[key: string]: unknown;
}
/** Write body of a DNS record (`content` or structured `data`, depending on the type). */
export interface CloudflareDnsRecordInput {
	name: string;
	type: string;
	content?: string;
	data?: Record<string, unknown>;
	priority?: number;
	ttl?: number;
	proxied?: boolean;
	comment?: string;
	tags?: string[];
}
export interface CloudflareListZoneInput { name?: string; accountId?: string; page?: number; perPage?: number }
export interface CloudflareCreateZoneInput { name: string; accountId: string; type?: 'full' | 'partial' | 'secondary' | string }
export interface CloudflareListDnsRecordInput { zoneId: string; name?: string; type?: string; page?: number; perPage?: number }
/** `POST /zones/{id}/dns_records/batch`: executed as one transaction in the order deletes, patches, puts, posts. */
export interface CloudflareBatchDnsRecordInput {
	zoneId: string;
	deletes?: { id: string }[];
	patches?: (Partial<CloudflareDnsRecordInput> & { id: string })[];
	puts?: (CloudflareDnsRecordInput & { id: string })[];
	posts?: CloudflareDnsRecordInput[];
}
export interface CloudflareBatchDnsRecordResult {
	deletes?: CloudflareDnsRecord[];
	patches?: CloudflareDnsRecord[];
	puts?: CloudflareDnsRecord[];
	posts?: CloudflareDnsRecord[];
}

function invalid(message: string): never {
	throw new CloudflareClientError('INVALID_REQUEST', message);
}
function id(value: unknown, label: string): string {
	if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/u.test(value)) invalid(`Cloudflare ${label} is invalid`);
	return value;
}
function positive(value: number | undefined, label: string, max: number): number | undefined {
	if (value === undefined) return undefined;
	if (!Number.isSafeInteger(value) || value < 1 || value > max) invalid(`Cloudflare ${label} is invalid`);
	return value;
}
function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function apiErrors(value: unknown): CloudflareApiErrorItem[] | undefined {
	if (!isRecord(value) || !Array.isArray(value.errors)) return undefined;
	return value.errors.filter(isRecord).map((item) => ({
		...(typeof item.code === 'number' ? { code: item.code } : {}),
		...(typeof item.message === 'string' ? { message: item.message.slice(0, 512) } : {}),
	}));
}

/** Builds `POST /zones` without a client, so previews need no credentials. */
export function prepareCloudflareCreateZone(input: CloudflareCreateZoneInput): CloudflarePreparedRequest {
	if (typeof input.name !== 'string' || !input.name || input.name.length > 253 || CONTROL.test(input.name)) invalid('Cloudflare zone name is invalid');
	return { method: 'POST', path: '/zones', body: { name: input.name, account: { id: id(input.accountId, 'account id') }, ...(input.type ? { type: input.type } : {}) } };
}

/** Typed Cloudflare API v4 client for the DNS subset (Bearer API token). Browser-safe; fetch is injectable. */
export class CloudflareClient {
	readonly type = 'cloudflare' as const;
	readonly apiUrl: string;
	readonly #token: string;
	readonly #fetch: FetchLike;
	readonly #timeoutMs: number;
	readonly #active = new Set<() => void>();
	#closed = false;

	constructor(options: CloudflareClientOptions) {
		try {
			const base = new URL(options.baseUrl ?? DefaultCloudflareApiUrl);
			if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error();
			this.apiUrl = base.toString().replace(/\/+$/u, '');
			if (typeof options.apiToken !== 'string' || !options.apiToken || /\s/u.test(options.apiToken) || CONTROL.test(options.apiToken)) throw new Error();
			this.#token = options.apiToken;
			this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
			if (typeof this.#fetch !== 'function') throw new Error();
			const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
			if (!Number.isSafeInteger(timeout) || timeout < 0 || timeout > MAX_TIMEOUT_MS) throw new Error();
			this.#timeoutMs = timeout;
		} catch {
			throw new CloudflareClientError('INVALID_CONFIG', 'Invalid Cloudflare configuration');
		}
	}

	get closed(): boolean {
		return this.#closed;
	}

	/** Sends a prepared request and returns the whole envelope (`result`, `result_info`). */
	async request(operation: string, request: CloudflarePreparedRequest, options?: CloudflareRequestOptions): Promise<{ result: unknown; result_info?: CloudflareResultInfo }> {
		if (this.#closed) throw new CloudflareClientError('CLOSED', 'Cloudflare client is closed');
		if (options?.signal?.aborted) throw new CloudflareClientError('ABORTED', 'Cloudflare request was aborted');
		const requested = positive(options?.timeoutMs, 'timeout', MAX_TIMEOUT_MS);
		// 0 disables the client timer: the caller owns the deadline (via `signal`).
		const timeoutMs = this.#timeoutMs === 0 ? requested : Math.min(this.#timeoutMs, requested ?? this.#timeoutMs);
		const apiBase = new URL(this.apiUrl);
		if (
			typeof request.path !== 'string' ||
			!request.path.startsWith('/') ||
			request.path.startsWith('//') ||
			CONTROL.test(request.path)
		) {
			invalid('Cloudflare request path is outside the configured API');
		}
		let url: URL;
		try {
			url = new URL(`${this.apiUrl}${request.path}`);
		} catch {
			invalid('Cloudflare request path is outside the configured API');
		}
		const apiPath = apiBase.pathname.replace(/\/+$/u, '');
		if (
			url.origin !== apiBase.origin ||
			Boolean(url.search || url.hash) ||
			(apiPath !== '' && url.pathname !== apiPath && !url.pathname.startsWith(`${apiPath}/`))
		) {
			invalid('Cloudflare request path is outside the configured API');
		}
		for (const [key, value] of Object.entries(request.query ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
		const controller = new AbortController();
		let rejectAbort!: (error: CloudflareClientError) => void;
		const aborted = new Promise<never>((_, reject) => {
			rejectAbort = reject;
		});
		void aborted.catch(() => undefined);
		const stop = (code: 'ABORTED' | 'TIMEOUT' | 'CLOSED') => {
			if (controller.signal.aborted) return;
			const message = code === 'TIMEOUT' ? 'Cloudflare request timed out' : code === 'CLOSED' ? 'Cloudflare client is closed' : 'Cloudflare request was aborted';
			const error = new CloudflareClientError(code, message);
			controller.abort(error);
			rejectAbort(error);
		};
		const onClose = () => stop('CLOSED');
		const onAbort = () => stop('ABORTED');
		this.#active.add(onClose);
		options?.signal?.addEventListener('abort', onAbort, { once: true });
		const timer = timeoutMs === undefined ? undefined : setTimeout(() => stop('TIMEOUT'), timeoutMs);
		let response: Response | undefined;
		try {
			const headers = new Headers({ authorization: `Bearer ${this.#token}`, accept: 'application/json' });
			let body: string | undefined;
			if (request.body !== undefined) {
				headers.set('content-type', 'application/json');
				body = JSON.stringify(request.body);
			}
			response = await Promise.race([
				this.#fetch(url, { method: request.method, headers, body, redirect: 'error', signal: controller.signal }),
				aborted,
			]);
			const text = await Promise.race([response.text(), aborted]);
			let payload: unknown;
			try {
				payload = text ? JSON.parse(text) : undefined;
			} catch {
				payload = undefined;
			}
			if (!response.ok || !isRecord(payload) || payload.success === false) {
				const status = response.status;
				if (response.ok && !isRecord(payload)) throw new CloudflareClientError('INVALID_RESPONSE', `Cloudflare ${operation} returned an invalid response`, status);
				const code =
					status === 401 || status === 403 ? 'AUTH_FAILED' : status === 404 ? 'NOT_FOUND' : status === 409 ? 'CONFLICT' : status === 429 ? 'RATE_LIMITED' : 'REQUEST_FAILED';
				throw new CloudflareClientError(code, `Cloudflare ${operation} request failed`, status, apiErrors(payload));
			}
			return { result: payload.result, ...(isRecord(payload.result_info) ? { result_info: payload.result_info as CloudflareResultInfo } : {}) };
		} catch (error) {
			try {
				const pending = response?.bodyUsed ? undefined : response?.body?.cancel();
				if (pending) void pending.catch(() => undefined);
			} catch {
				/* cleanup must not replace the request error */
			}
			if (controller.signal.reason instanceof CloudflareClientError) throw controller.signal.reason;
			if (error instanceof CloudflareClientError) throw error;
			throw new CloudflareClientError('REQUEST_FAILED', `Cloudflare ${operation} request failed`);
		} finally {
			clearTimeout(timer);
			options?.signal?.removeEventListener('abort', onAbort);
			this.#active.delete(onClose);
		}
	}

	async #page<T>(operation: string, request: CloudflarePreparedRequest, options?: CloudflareRequestOptions): Promise<CloudflarePage<T>> {
		const { result, result_info } = await this.request(operation, request, options);
		if (!Array.isArray(result) || result.some((item) => !isRecord(item))) throw new CloudflareClientError('INVALID_RESPONSE', `Cloudflare ${operation} returned an invalid response`);
		return { result: result as T[], ...(result_info ? { resultInfo: result_info } : {}) };
	}

	async #one<T>(operation: string, request: CloudflarePreparedRequest, options?: CloudflareRequestOptions): Promise<T> {
		const { result } = await this.request(operation, request, options);
		if (!isRecord(result)) throw new CloudflareClientError('INVALID_RESPONSE', `Cloudflare ${operation} returned an invalid response`);
		return result as T;
	}

	/** `GET /zones`; `perPage` is capped by Cloudflare at 50. */
	listZone(input: CloudflareListZoneInput = {}, options?: CloudflareRequestOptions) {
		const query = {
			name: input.name,
			'account.id': input.accountId === undefined ? undefined : id(input.accountId, 'account id'),
			page: positive(input.page, 'page', 1_000_000),
			per_page: positive(input.perPage, 'page size', 50),
		};
		return this.#page<CloudflareZone>('list zones', { method: 'GET', path: '/zones', query }, options);
	}
	getZone(input: { zoneId: string }, options?: CloudflareRequestOptions) {
		return this.#one<CloudflareZone>('get zone', { method: 'GET', path: `/zones/${id(input.zoneId, 'zone id')}` }, options);
	}
	prepareCreateZone(input: CloudflareCreateZoneInput): CloudflarePreparedRequest {
		return prepareCloudflareCreateZone(input);
	}
	createZone(input: CloudflareCreateZoneInput, options?: CloudflareRequestOptions) {
		return this.#one<CloudflareZone>('create zone', this.prepareCreateZone(input), options);
	}
	prepareDeleteZone(input: { zoneId: string }): CloudflarePreparedRequest {
		return { method: 'DELETE', path: `/zones/${id(input.zoneId, 'zone id')}` };
	}
	async deleteZone(input: { zoneId: string }, options?: CloudflareRequestOptions): Promise<void> {
		await this.request('delete zone', this.prepareDeleteZone(input), options);
	}

	/** `GET /zones/{id}/dns_records`; `name` is an exact match. */
	listDnsRecord(input: CloudflareListDnsRecordInput, options?: CloudflareRequestOptions) {
		const query = {
			name: input.name,
			type: input.type,
			page: positive(input.page, 'page', 1_000_000),
			per_page: positive(input.perPage, 'page size', 5_000),
		};
		return this.#page<CloudflareDnsRecord>('list DNS records', { method: 'GET', path: `/zones/${id(input.zoneId, 'zone id')}/dns_records`, query }, options);
	}
	createDnsRecord(input: { zoneId: string; record: CloudflareDnsRecordInput }, options?: CloudflareRequestOptions) {
		return this.#one<CloudflareDnsRecord>('create DNS record', { method: 'POST', path: `/zones/${id(input.zoneId, 'zone id')}/dns_records`, body: input.record }, options);
	}
	/** `PUT` overwrites the whole record. */
	updateDnsRecord(input: { zoneId: string; recordId: string; record: CloudflareDnsRecordInput }, options?: CloudflareRequestOptions) {
		const path = `/zones/${id(input.zoneId, 'zone id')}/dns_records/${id(input.recordId, 'record id')}`;
		return this.#one<CloudflareDnsRecord>('update DNS record', { method: 'PUT', path, body: input.record }, options);
	}
	async deleteDnsRecord(input: { zoneId: string; recordId: string }, options?: CloudflareRequestOptions): Promise<void> {
		await this.request('delete DNS record', { method: 'DELETE', path: `/zones/${id(input.zoneId, 'zone id')}/dns_records/${id(input.recordId, 'record id')}` }, options);
	}
	prepareBatchDnsRecord(input: CloudflareBatchDnsRecordInput): CloudflarePreparedRequest {
		const body: Record<string, unknown> = {};
		if (input.deletes?.length) body.deletes = input.deletes.map((item) => ({ id: id(item.id, 'record id') }));
		if (input.patches?.length) body.patches = input.patches.map((item) => ({ ...item, id: id(item.id, 'record id') }));
		if (input.puts?.length) body.puts = input.puts.map((item) => ({ ...item, id: id(item.id, 'record id') }));
		if (input.posts?.length) body.posts = input.posts;
		return { method: 'POST', path: `/zones/${id(input.zoneId, 'zone id')}/dns_records/batch`, body };
	}
	/** Applies all changes in one Cloudflare transaction; on failure nothing is applied. */
	batchDnsRecord(input: CloudflareBatchDnsRecordInput, options?: CloudflareRequestOptions) {
		return this.#one<CloudflareBatchDnsRecordResult>('batch DNS records', this.prepareBatchDnsRecord(input), options);
	}

	/** Aborts in-flight requests; later requests fail with `CLOSED`. */
	async close(): Promise<void> {
		this.#closed = true;
		for (const stop of [...this.#active]) stop();
		this.#active.clear();
	}
}
