import type { FetchLike } from '@wener/utils';
import { signv3 } from './signv3';

/**
 * Alibaba Cloud DNS (Alidns, API version 2015-01-09) RPC client with ACS3-HMAC-SHA256 signing.
 * Browser-safe (Web Crypto via `signv3`); fetch is injectable.
 *
 * @see https://help.aliyun.com/zh/dns/api-alidns-2015-01-09-dir-domain-management
 */
export const DefaultAlidnsEndpoint = 'alidns.aliyuncs.com';
export const AlidnsApiVersion = '2015-01-09';
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 3_600_000;
// biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are rejected deliberately
const CONTROL = /[\x00-\x1f\x7f]/u;

export type AlidnsClientErrorCode =
	| 'INVALID_CONFIG'
	| 'INVALID_REQUEST'
	| 'INVALID_RESPONSE'
	| 'AUTH_FAILED'
	| 'NOT_FOUND'
	| 'REQUEST_FAILED'
	| 'TIMEOUT'
	| 'ABORTED'
	| 'CLOSED';

/** Errors carry the Alidns error code and request id only; never credentials, signatures or response text. */
export class AlidnsClientError extends Error {
	readonly code: AlidnsClientErrorCode;
	readonly status?: number;
	readonly apiCode?: string;
	readonly requestId?: string;
	constructor(code: AlidnsClientErrorCode, message: string, extra: { status?: number; apiCode?: string; requestId?: string } = {}) {
		super(message);
		this.name = 'AlidnsClientError';
		this.code = code;
		this.status = extra.status;
		this.apiCode = extra.apiCode;
		this.requestId = extra.requestId;
	}
}

export interface AlidnsClientOptions {
	accessKeyId: string;
	accessKeySecret: string;
	/** Host name, defaults to {@link DefaultAlidnsEndpoint}. */
	endpoint?: string;
	fetch?: FetchLike;
	/** Per-request timeout; `0` disables it when the caller owns a deadline. Default 30000. */
	timeoutMs?: number;
}
export interface AlidnsRequestOptions { signal?: AbortSignal; timeoutMs?: number }
export type AlidnsParams = Record<string, string | number | boolean | undefined>;
export interface AlidnsPreparedRequest { action: string; params: AlidnsParams }

export interface AlidnsDomain {
	DomainId?: string;
	DomainName: string;
	PunyCode?: string;
	RecordCount?: number;
	DnsServers?: { DnsServer?: string[] };
	[key: string]: unknown;
}
export interface AlidnsRecord {
	RecordId: string;
	DomainName?: string;
	RR: string;
	Type: string;
	Value: string;
	TTL: number;
	Priority?: number;
	Line?: string;
	/** `Enable` / `Disable` (case varies between API versions). */
	Status?: string;
	Locked?: boolean;
	Weight?: number;
	Remark?: string;
	[key: string]: unknown;
}
export interface AlidnsPage<T> { items: T[]; totalCount: number; pageNumber: number; pageSize: number }
export interface AlidnsRecordInput { RR: string; Type: string; Value: string; TTL?: number; Priority?: number; Line?: string }

function invalid(message: string): never {
	throw new AlidnsClientError('INVALID_REQUEST', message);
}
function text(value: unknown, label: string, max = 1024): string {
	if (typeof value !== 'string' || !value.trim() || value.length > max || CONTROL.test(value)) invalid(`Alidns ${label} is invalid`);
	return value.trim();
}
function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function positive(value: number | undefined, label: string, max: number): number | undefined {
	if (value === undefined) return undefined;
	if (!Number.isSafeInteger(value) || value < 1 || value > max) invalid(`Alidns ${label} is invalid`);
	return value;
}
/** RFC 3986 percent-encoding required by the ACS3 canonical query string. */
function rfc3986(value: string): string {
	return encodeURIComponent(value).replace(/[!'()*]/gu, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
}
function recordParams(input: AlidnsRecordInput): AlidnsParams {
	return {
		RR: text(input.RR, 'record RR', 253),
		Type: text(input.Type, 'record type', 32).toUpperCase(),
		Value: text(input.Value, 'record value', 65_535),
		TTL: positive(input.TTL, 'TTL', 2_147_483_647),
		Priority: input.Priority === undefined ? undefined : positive(input.Priority, 'priority', 65_535),
		Line: input.Line === undefined ? undefined : text(input.Line, 'line', 64),
	};
}

export class AlidnsClient {
	readonly type = 'alidns' as const;
	readonly endpoint: string;
	readonly #accessKeyId: string;
	readonly #accessKeySecret: string;
	readonly #fetch: FetchLike;
	readonly #timeoutMs: number;
	readonly #active = new Set<() => void>();
	#closed = false;

	constructor(options: AlidnsClientOptions) {
		try {
			const endpoint = options.endpoint ?? DefaultAlidnsEndpoint;
			if (!/^[A-Za-z0-9.-]{1,253}(:\d{1,5})?$/u.test(endpoint)) throw new Error();
			this.endpoint = endpoint;
			for (const value of [options.accessKeyId, options.accessKeySecret]) {
				if (typeof value !== 'string' || !value || /\s/u.test(value) || CONTROL.test(value)) throw new Error();
			}
			this.#accessKeyId = options.accessKeyId;
			this.#accessKeySecret = options.accessKeySecret;
			this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
			if (typeof this.#fetch !== 'function') throw new Error();
			const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
			if (!Number.isSafeInteger(timeout) || timeout < 0 || timeout > MAX_TIMEOUT_MS) throw new Error();
			this.#timeoutMs = timeout;
		} catch {
			throw new AlidnsClientError('INVALID_CONFIG', 'Invalid Alidns configuration');
		}
	}

	get closed(): boolean {
		return this.#closed;
	}

	/** Signs and sends one RPC action; returns the response object (with `RequestId`). */
	async request(prepared: AlidnsPreparedRequest, options?: AlidnsRequestOptions): Promise<Record<string, unknown>> {
		const action = text(prepared.action, 'action', 128);
		if (!/^[A-Za-z]+$/u.test(action)) invalid('Alidns action is invalid');
		if (this.#closed) throw new AlidnsClientError('CLOSED', 'Alidns client is closed');
		if (options?.signal?.aborted) throw new AlidnsClientError('ABORTED', 'Alidns request was aborted');
		const requested = positive(options?.timeoutMs, 'timeout', MAX_TIMEOUT_MS);
		// 0 disables the client timer: the caller owns the deadline (via `signal`).
		const timeoutMs = this.#timeoutMs === 0 ? requested : Math.min(this.#timeoutMs, requested ?? this.#timeoutMs);
		const query = Object.entries(prepared.params)
			.filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
			.map(([key, value]) => [rfc3986(key), rfc3986(String(value))] as const)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
			.map(([key, value]) => `${key}=${value}`)
			.join('&');
		const url = `https://${this.endpoint}/${query ? `?${query}` : ''}`;
		const controller = new AbortController();
		let rejectAbort!: (error: AlidnsClientError) => void;
		const aborted = new Promise<never>((_, reject) => {
			rejectAbort = reject;
		});
		void aborted.catch(() => undefined);
		const stop = (code: 'ABORTED' | 'TIMEOUT' | 'CLOSED') => {
			if (controller.signal.aborted) return;
			const message = code === 'TIMEOUT' ? 'Alidns request timed out' : code === 'CLOSED' ? 'Alidns client is closed' : 'Alidns request was aborted';
			const error = new AlidnsClientError(code, message);
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
			const signed = await Promise.race([
				signv3(
					{ method: 'POST', url, headers: { accept: 'application/json', 'x-acs-action': action, 'x-acs-version': AlidnsApiVersion } },
					{ accessKeyId: this.#accessKeyId, accessKeySecret: this.#accessKeySecret },
				),
				aborted,
			]);
			// `host` is signed but set by fetch itself (forbidden header in browsers).
			const { host: _host, ...headers } = signed.headers as Record<string, string>;
			response = await Promise.race([
				this.#fetch(url, { method: 'POST', headers, redirect: 'error', signal: controller.signal }),
				aborted,
			]);
			const body = await Promise.race([response.text(), aborted]);
			let payload: unknown;
			try {
				payload = body ? JSON.parse(body) : undefined;
			} catch {
				payload = undefined;
			}
			const requestId = isRecord(payload) && typeof payload.RequestId === 'string' ? payload.RequestId : undefined;
			const apiCode = isRecord(payload) && typeof payload.Code === 'string' ? payload.Code.slice(0, 128) : undefined;
			if (!response.ok || apiCode) {
				const status = response.status;
				const code =
					status === 401 || status === 403 || /^(InvalidAccessKeyId|SignatureDoesNotMatch|Forbidden|IncompleteSignature)/u.test(apiCode ?? '')
						? 'AUTH_FAILED'
						: status === 404 || /NotExist|NotFound|DomainRecordNotBelongToUser/u.test(apiCode ?? '')
							? 'NOT_FOUND'
							: 'REQUEST_FAILED';
				throw new AlidnsClientError(code, `Alidns ${action} failed${apiCode ? `: ${apiCode}` : ''}`, { status, apiCode, requestId });
			}
			if (!isRecord(payload)) throw new AlidnsClientError('INVALID_RESPONSE', `Alidns ${action} returned an invalid response`, { status: response.status });
			return payload;
		} catch (error) {
			try {
				const pending = response?.bodyUsed ? undefined : response?.body?.cancel();
				if (pending) void pending.catch(() => undefined);
			} catch {
				/* cleanup must not replace the request error */
			}
			if (controller.signal.reason instanceof AlidnsClientError) throw controller.signal.reason;
			if (error instanceof AlidnsClientError) throw error;
			throw new AlidnsClientError('REQUEST_FAILED', `Alidns ${action} failed`);
		} finally {
			clearTimeout(timer);
			options?.signal?.removeEventListener('abort', onAbort);
			this.#active.delete(onClose);
		}
	}

	#page<T>(value: Record<string, unknown>, outer: string, inner: string): AlidnsPage<T> {
		const container = value[outer];
		const list = isRecord(container) ? container[inner] : undefined;
		if (list !== undefined && (!Array.isArray(list) || list.some((item) => !isRecord(item)))) throw new AlidnsClientError('INVALID_RESPONSE', 'Alidns returned an invalid response');
		return {
			items: (list ?? []) as T[],
			totalCount: Number(value.TotalCount ?? 0),
			pageNumber: Number(value.PageNumber ?? 1),
			pageSize: Number(value.PageSize ?? 0),
		};
	}

	/** DescribeDomains; `pageSize` max 100. `keyWord` with `searchMode: 'EXACT'` matches one domain. */
	async describeDomains(input: { keyWord?: string; searchMode?: 'LIKE' | 'EXACT'; pageNumber?: number; pageSize?: number } = {}, options?: AlidnsRequestOptions) {
		const params = {
			KeyWord: input.keyWord === undefined ? undefined : text(input.keyWord, 'keyword', 253),
			SearchMode: input.searchMode,
			PageNumber: positive(input.pageNumber, 'page', 1_000_000),
			PageSize: positive(input.pageSize, 'page size', 100),
		};
		return this.#page<AlidnsDomain>(await this.request({ action: 'DescribeDomains', params }, options), 'Domains', 'Domain');
	}
	prepareAddDomain(input: { domainName: string }): AlidnsPreparedRequest {
		return { action: 'AddDomain', params: { DomainName: text(input.domainName, 'domain name', 253) } };
	}
	async addDomain(input: { domainName: string }, options?: AlidnsRequestOptions) {
		return (await this.request(this.prepareAddDomain(input), options)) as AlidnsDomain & { RequestId: string };
	}
	prepareDeleteDomain(input: { domainName: string }): AlidnsPreparedRequest {
		return { action: 'DeleteDomain', params: { DomainName: text(input.domainName, 'domain name', 253) } };
	}
	async deleteDomain(input: { domainName: string }, options?: AlidnsRequestOptions): Promise<void> {
		await this.request(this.prepareDeleteDomain(input), options);
	}
	/** DescribeDomainRecords; `pageSize` max 500. `rrKeyWord` is a fuzzy filter. */
	async describeDomainRecords(
		input: { domainName: string; rrKeyWord?: string; type?: string; pageNumber?: number; pageSize?: number },
		options?: AlidnsRequestOptions,
	) {
		const params = {
			DomainName: text(input.domainName, 'domain name', 253),
			RRKeyWord: input.rrKeyWord === undefined ? undefined : text(input.rrKeyWord, 'RR keyword', 253),
			Type: input.type === undefined ? undefined : text(input.type, 'record type', 32).toUpperCase(),
			PageNumber: positive(input.pageNumber, 'page', 1_000_000),
			PageSize: positive(input.pageSize, 'page size', 500),
		};
		return this.#page<AlidnsRecord>(await this.request({ action: 'DescribeDomainRecords', params }, options), 'DomainRecords', 'Record');
	}
	prepareAddDomainRecord(input: { domainName: string } & AlidnsRecordInput): AlidnsPreparedRequest {
		return { action: 'AddDomainRecord', params: { DomainName: text(input.domainName, 'domain name', 253), ...recordParams(input) } };
	}
	async addDomainRecord(input: { domainName: string } & AlidnsRecordInput, options?: AlidnsRequestOptions) {
		return (await this.request(this.prepareAddDomainRecord(input), options)) as { RecordId: string; RequestId: string };
	}
	prepareUpdateDomainRecord(input: { recordId: string } & AlidnsRecordInput): AlidnsPreparedRequest {
		return { action: 'UpdateDomainRecord', params: { RecordId: text(input.recordId, 'record id', 64), ...recordParams(input) } };
	}
	async updateDomainRecord(input: { recordId: string } & AlidnsRecordInput, options?: AlidnsRequestOptions) {
		return (await this.request(this.prepareUpdateDomainRecord(input), options)) as { RecordId: string; RequestId: string };
	}
	prepareDeleteDomainRecord(input: { recordId: string }): AlidnsPreparedRequest {
		return { action: 'DeleteDomainRecord', params: { RecordId: text(input.recordId, 'record id', 64) } };
	}
	async deleteDomainRecord(input: { recordId: string }, options?: AlidnsRequestOptions): Promise<void> {
		await this.request(this.prepareDeleteDomainRecord(input), options);
	}

	/** Aborts in-flight requests; later requests fail with `CLOSED`. */
	async close(): Promise<void> {
		this.#closed = true;
		for (const stop of [...this.#active]) stop();
		this.#active.clear();
	}
}
