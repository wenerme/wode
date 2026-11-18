import type { FetchLike } from '@wener/utils';
import { PowerDnsClientError } from './errors';

export { PowerDnsClientError, type PowerDnsClientErrorCode } from './errors';

export const DefaultPowerDnsServerId = 'localhost';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RESPONSE_BYTES = 16 * 1024 * 1024;
const MAX_TIMEOUT_MS = 3_600_000;
const MAX_RESPONSE_BYTES = 64 * 1024 * 1024;
const METHODS = ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export type PowerDnsHttpMethod = (typeof METHODS)[number];
export type PowerDnsQueryValue = string | number | boolean | null | undefined;
export type PowerDnsResource = Record<string, unknown>;

export interface PowerDnsClientOptions {
	/** Server root (`https://dns.example.com`) or API root (`https://dns.example.com/api/v1`). */
	baseUrl: string;
	apiKey: string;
	/** Default server id; PowerDNS Authoritative uses `localhost`. */
	server?: string;
	headers?: Record<string, string>;
	fetch?: FetchLike;
	timeoutMs?: number;
	maxResponseBytes?: number;
}

export interface PowerDnsRequestOptions {
	signal?: AbortSignal;
	timeoutMs?: number;
}

export interface PowerDnsRawRequestInput {
	/** Path relative to `/api/v1`, for example `/servers/localhost/zones`. */
	path: string;
	method?: PowerDnsHttpMethod | string;
	query?: Record<string, PowerDnsQueryValue | PowerDnsQueryValue[]>;
	body?: unknown;
}

export interface PowerDnsServerInput { server?: string }
export interface PowerDnsSearchDataInput extends PowerDnsServerInput { query: string; max?: number; objectType?: 'all' | 'zone' | 'record' | 'comment' }
export interface PowerDnsListZoneInput extends PowerDnsServerInput { zone?: string; dnssec?: boolean }
export interface PowerDnsZoneInput extends PowerDnsServerInput { zone: string }
export interface PowerDnsGetZoneInput extends PowerDnsZoneInput { rrsets?: boolean; rrsetName?: string; rrsetType?: string }
export interface PowerDnsCreateZoneInput extends PowerDnsZoneInput {
	kind?: 'Native' | 'Master' | 'Slave' | 'Producer' | 'Consumer';
	masters?: string[];
	nameservers?: string[];
	account?: string;
	dnssec?: boolean;
}
export interface PowerDnsRecordInput { content: string; disabled?: boolean }
export interface PowerDnsCommentInput { content: string; account?: string; modifiedAt?: number }
export interface PowerDnsReplaceRrsetInput extends PowerDnsZoneInput {
	name: string;
	type: string;
	ttl: number;
	records: PowerDnsRecordInput[];
	comments?: PowerDnsCommentInput[];
}
export interface PowerDnsDeleteRrsetInput extends PowerDnsZoneInput { name: string; type: string }
export interface PowerDnsMetadataInput extends PowerDnsZoneInput { kind: string }
export interface PowerDnsSetMetadataInput extends PowerDnsMetadataInput { values: string[] }
export interface PowerDnsCryptokeyInput extends PowerDnsZoneInput { id: number }
export interface PowerDnsCreateCryptokeyInput extends PowerDnsZoneInput {
	keytype?: 'ksk' | 'zsk' | 'csk';
	algorithm?: string;
	bits?: number;
	active?: boolean;
	published?: boolean;
}
export interface PowerDnsUpdateCryptokeyInput extends PowerDnsCryptokeyInput { active?: boolean; published?: boolean }
export interface PowerDnsTsigKeyInput extends PowerDnsServerInput { id: string }
export interface PowerDnsCreateTsigKeyInput extends PowerDnsServerInput { name: string; algorithm?: string; key?: string }
export interface PowerDnsUpdateTsigKeyInput extends PowerDnsTsigKeyInput { name?: string; algorithm?: string; key?: string }

export interface PowerDnsPreparedRequest {
	method: PowerDnsHttpMethod;
	path: string;
	query?: Record<string, PowerDnsQueryValue | PowerDnsQueryValue[]>;
	body?: unknown;
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are rejected deliberately
const CONTROL = /[\x00-\x1f\x7f]/u;

function invalid(message: string): never {
	throw new PowerDnsClientError('INVALID_REQUEST', message);
}

function text(value: unknown, label: string, maximum = 1024): string {
	if (typeof value !== 'string' || !value.trim() || value.length > maximum || CONTROL.test(value)) invalid(`PowerDNS ${label} is invalid`);
	return value.trim();
}

/** Non-read HTTP methods change PowerDNS state. */
export function isPowerDnsWriteMethod(method: string | undefined): boolean {
	const value = (method ?? 'GET').toUpperCase();
	return value !== 'GET' && value !== 'HEAD' && value !== 'OPTIONS';
}

/** Raw request method default: GET without a body, POST with a body. */
export function resolvePowerDnsMethod(input: { method?: string; body?: unknown }): PowerDnsHttpMethod {
	const method = (input.method ?? (input.body === undefined ? 'GET' : 'POST')).trim().toUpperCase();
	if (!(METHODS as readonly string[]).includes(method)) invalid('PowerDNS HTTP method is invalid');
	return method as PowerDnsHttpMethod;
}

/** A raw request is a write when the method is non-read or a body is sent. */
export function isPowerDnsWriteRequest(input: { method?: string; body?: unknown }): boolean {
	return isPowerDnsWriteMethod(input.method ?? (input.body === undefined ? 'GET' : 'POST')) || input.body !== undefined;
}

/**
 * Raw paths stay inside the API root: absolute, no authority (`//`), fragment, backslash,
 * control characters, or `.`/`..` segments (also when percent-encoded).
 */
export function isSafePowerDnsPath(path: string): boolean {
	if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.length > 2048) return false;
	if (path.includes('#') || path.includes('\\') || CONTROL.test(path)) return false;
	const pathname = path.split('?', 1)[0] ?? '';
	for (const segment of pathname.split('/')) {
		let decoded: string;
		try {
			decoded = decodeURIComponent(segment);
		} catch {
			return false;
		}
		if (decoded === '.' || decoded === '..' || decoded.includes('/') || decoded.includes('\\')) return false;
	}
	return true;
}

/** Zone ids are canonical (absolute) names. */
export function normalizePowerDnsZone(zone: string): string {
	const value = text(zone, 'zone name');
	return value.endsWith('.') ? value : `${value}.`;
}

/** `@` is the apex; relative names are resolved below the zone, names already inside the zone become absolute. */
export function normalizePowerDnsRecordName(name: string, zone: string): string {
	const value = text(name, 'record name');
	const zoneName = normalizePowerDnsZone(zone);
	if (value === '@') return zoneName;
	if (value.endsWith('.')) return value;
	const bare = zoneName.slice(0, -1).toLowerCase();
	const lower = value.toLowerCase();
	if (lower === bare || lower.endsWith(`.${bare}`)) return `${value}.`;
	return `${value}.${zoneName}`;
}

/** A single path segment that cannot be resolved as `.`/`..` or collapse to empty by URL parsing. */
export function isSafePowerDnsSegment(value: string): boolean {
	return typeof value === 'string' && value !== '' && value !== '.' && value !== '..' && !value.includes('/');
}

const enc = (value: string | number) => {
	const text = String(value);
	if (!isSafePowerDnsSegment(text)) invalid('PowerDNS path segment is invalid');
	return encodeURIComponent(text);
};

/**
 * PowerDNS zone id (`apiZoneNameToId`): keeps `[A-Za-z0-9._-]`, escapes other bytes as `=XX`,
 * and represents the root zone `.` as `=2E`.
 */
export function powerDnsZoneId(zone: string): string {
	const name = normalizePowerDnsZone(zone);
	if (name === '.') return '=2E';
	let id = '';
	for (const byte of new TextEncoder().encode(name)) {
		const char = String.fromCharCode(byte);
		id += /[A-Za-z0-9._-]/u.test(char) ? char : `=${byte.toString(16).toUpperCase().padStart(2, '0')}`;
	}
	return id;
}

function validInteger(value: number | undefined, fallback: number, maximum: number): number {
	if (value === undefined) return fallback;
	if (!Number.isSafeInteger(value) || value < 1 || value > maximum) throw new Error();
	return value;
}

/** Typed PowerDNS Authoritative HTTP API client (`X-API-Key`). Browser-safe; fetch is injectable. */
export class PowerDnsClient {
	readonly type = 'powerdns' as const;
	readonly apiUrl: string;
	readonly server: string;
	readonly #fetch: FetchLike;
	readonly #headers: Headers;
	readonly #timeoutMs: number;
	readonly #maxResponseBytes: number;
	readonly #active = new Set<() => void>();
	#closed = false;

	constructor(options: PowerDnsClientOptions) {
		try {
			const base = new URL(options.baseUrl);
			if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error();
			let root = base.toString().replace(/\/+$/u, '');
			if (!/\/api\/v1$/u.test(root)) root = `${root}/api/v1`;
			this.apiUrl = root;
			if (typeof options.apiKey !== 'string' || !options.apiKey || /[\s\x00-\x1f\x7f]/u.test(options.apiKey)) throw new Error();
			this.#headers = new Headers();
			for (const [key, value] of Object.entries(options.headers ?? {})) {
				if (!key.trim() || CONTROL.test(key) || /[\r\n]/u.test(value)) throw new Error();
				this.#headers.set(key, value);
			}
			if (this.#headers.has('x-api-key')) throw new Error();
			this.#headers.set('x-api-key', options.apiKey);
			if (!this.#headers.has('accept')) this.#headers.set('accept', 'application/json');
			this.server = text(options.server ?? DefaultPowerDnsServerId, 'server id', 512);
			this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
			if (typeof this.#fetch !== 'function') throw new Error();
			this.#timeoutMs = validInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);
			this.#maxResponseBytes = validInteger(options.maxResponseBytes, DEFAULT_MAX_RESPONSE_BYTES, MAX_RESPONSE_BYTES);
		} catch {
			throw new PowerDnsClientError('INVALID_CONFIG', 'Invalid PowerDNS configuration');
		}
	}

	#url(path: string, query: PowerDnsPreparedRequest['query']): URL {
		const url = new URL(`${this.apiUrl}${path}`);
		for (const [key, value] of Object.entries(query ?? {})) {
			for (const item of Array.isArray(value) ? value : [value]) {
				if (item === undefined || item === null) continue;
				url.searchParams.append(key, String(item));
			}
		}
		return url;
	}

	async #send(operation: string, request: PowerDnsPreparedRequest, options?: PowerDnsRequestOptions): Promise<unknown> {
		if (this.#closed) throw new PowerDnsClientError('CLOSED', 'PowerDNS client is closed');
		if (options?.signal?.aborted) throw new PowerDnsClientError('ABORTED', 'PowerDNS request was aborted');
		let timeoutMs: number;
		try {
			timeoutMs = Math.min(this.#timeoutMs, validInteger(options?.timeoutMs, this.#timeoutMs, MAX_TIMEOUT_MS));
		} catch {
			throw new PowerDnsClientError('INVALID_REQUEST', 'PowerDNS timeout is invalid');
		}
		let payload: string | undefined;
		if (request.body !== undefined) {
			try {
				payload = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
			} catch {
				invalid('PowerDNS request body is not JSON serializable');
			}
			if (new TextEncoder().encode(payload).byteLength > this.#maxResponseBytes) invalid('PowerDNS request body is too large');
		}
		const controller = new AbortController();
		let rejectAbort!: (error: PowerDnsClientError) => void;
		const aborted = new Promise<never>((_, reject) => {
			rejectAbort = reject;
		});
		void aborted.catch(() => undefined);
		const stop = (code: 'ABORTED' | 'TIMEOUT' | 'CLOSED') => {
			if (controller.signal.aborted) return;
			const message = code === 'TIMEOUT' ? 'PowerDNS request timed out' : code === 'CLOSED' ? 'PowerDNS client is closed' : 'PowerDNS request was aborted';
			const error = new PowerDnsClientError(code, message);
			controller.abort(error);
			rejectAbort(error);
		};
		const onClose = () => stop('CLOSED');
		const onAbort = () => stop('ABORTED');
		this.#active.add(onClose);
		options?.signal?.addEventListener('abort', onAbort, { once: true });
		const timer = setTimeout(() => stop('TIMEOUT'), timeoutMs);
		let response: Response | undefined;
		let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
		try {
			const headers = new Headers(this.#headers);
			if (payload !== undefined) headers.set('content-type', 'application/json');
			response = await Promise.race([
				this.#fetch(this.#url(request.path, request.query), {
					method: request.method,
					headers,
					body: payload,
					redirect: 'error',
					signal: controller.signal,
				}),
				aborted,
			]);
			const length = response.headers.get('content-length');
			if (length !== null && /^\d+$/u.test(length) && Number(length) > this.#maxResponseBytes)
				throw new PowerDnsClientError('RESPONSE_TOO_LARGE', 'PowerDNS response is too large');
			const chunks: Uint8Array[] = [];
			let size = 0;
			reader = response.body?.getReader();
			if (reader) {
				while (true) {
					const chunk = await Promise.race([reader.read(), aborted]);
					if (chunk.done) break;
					size += chunk.value.byteLength;
					if (size > this.#maxResponseBytes) throw new PowerDnsClientError('RESPONSE_TOO_LARGE', 'PowerDNS response is too large');
					chunks.push(chunk.value);
				}
				reader = undefined;
			}
			const bytes = new Uint8Array(size);
			let offset = 0;
			for (const chunk of chunks) {
				bytes.set(chunk, offset);
				offset += chunk.byteLength;
			}
			if (!response.ok) {
				const status = response.status;
				const code = status === 401 || status === 403 ? 'AUTH_FAILED' : status === 404 ? 'NOT_FOUND' : status === 409 ? 'CONFLICT' : 'REQUEST_FAILED';
				throw new PowerDnsClientError(code, `PowerDNS ${operation} request failed`, status);
			}
			const body = new TextDecoder().decode(bytes);
			if (!body) return undefined;
			const contentType = response.headers.get('content-type') ?? '';
			const trimmed = body.trim();
			if (!contentType.includes('json') && !trimmed.startsWith('{') && !trimmed.startsWith('[')) return body;
			try {
				return JSON.parse(body) as unknown;
			} catch {
				throw new PowerDnsClientError('INVALID_RESPONSE', 'PowerDNS returned invalid JSON');
			}
		} catch (error) {
			try {
				const pending = reader ? reader.cancel() : response?.body?.cancel();
				if (pending) void pending.catch(() => undefined);
			} catch {
				/* cleanup must not replace the fixed request error */
			}
			if (controller.signal.reason instanceof PowerDnsClientError) throw controller.signal.reason;
			if (error instanceof PowerDnsClientError) throw error;
			throw new PowerDnsClientError('REQUEST_FAILED', `PowerDNS ${operation} request failed`);
		} finally {
			clearTimeout(timer);
			options?.signal?.removeEventListener('abort', onAbort);
			this.#active.delete(onClose);
		}
	}

	#server(input?: PowerDnsServerInput): string {
		return `/servers/${enc(text(input?.server ?? this.server, 'server id', 512))}`;
	}

	#zone(input: PowerDnsZoneInput): string {
		return `${this.#server(input)}/zones/${enc(powerDnsZoneId(input.zone))}`;
	}

	async #resource(operation: string, request: PowerDnsPreparedRequest, options?: PowerDnsRequestOptions): Promise<PowerDnsResource> {
		const value = await this.#send(operation, request, options);
		if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PowerDnsClientError('INVALID_RESPONSE', 'PowerDNS returned an invalid response');
		return value as PowerDnsResource;
	}

	async #list(operation: string, request: PowerDnsPreparedRequest, options?: PowerDnsRequestOptions): Promise<PowerDnsResource[]> {
		const value = await this.#send(operation, request, options);
		if (!Array.isArray(value) || value.some((item) => !item || typeof item !== 'object' || Array.isArray(item)))
			throw new PowerDnsClientError('INVALID_RESPONSE', 'PowerDNS returned an invalid response');
		return value as PowerDnsResource[];
	}

	async listServer(options?: PowerDnsRequestOptions) {
		return this.#list('list servers', { method: 'GET', path: '/servers' }, options);
	}
	async getServer(input: PowerDnsServerInput = {}, options?: PowerDnsRequestOptions) {
		return this.#resource('get server', { method: 'GET', path: this.#server(input) }, options);
	}
	async listServerStatistic(input: PowerDnsServerInput = {}, options?: PowerDnsRequestOptions) {
		return this.#list('get statistics', { method: 'GET', path: `${this.#server(input)}/statistics` }, options);
	}
	async searchData(input: PowerDnsSearchDataInput, options?: PowerDnsRequestOptions) {
		if (input.max !== undefined && (!Number.isSafeInteger(input.max) || input.max < 1)) invalid('PowerDNS search limit is invalid');
		const query = { q: text(input.query, 'search query', 1024), max: input.max ?? 100, object_type: input.objectType };
		return this.#list('search data', { method: 'GET', path: `${this.#server(input)}/search-data`, query }, options);
	}
	async listZone(input: PowerDnsListZoneInput = {}, options?: PowerDnsRequestOptions) {
		const query = { zone: input.zone === undefined ? undefined : normalizePowerDnsZone(input.zone), dnssec: input.dnssec };
		return this.#list('list zones', { method: 'GET', path: `${this.#server(input)}/zones`, query }, options);
	}
	async getZone(input: PowerDnsGetZoneInput, options?: PowerDnsRequestOptions) {
		const query = {
			rrsets: input.rrsets,
			rrset_name: input.rrsetName === undefined ? undefined : normalizePowerDnsRecordName(input.rrsetName, input.zone),
			rrset_type: input.rrsetType === undefined ? undefined : text(input.rrsetType, 'record type', 32).toUpperCase(),
		};
		return this.#resource('get zone', { method: 'GET', path: this.#zone(input), query }, options);
	}

	/** Builds the zone creation request without sending it. */
	prepareCreateZone(input: PowerDnsCreateZoneInput): PowerDnsPreparedRequest {
		return {
			method: 'POST',
			path: `${this.#server(input)}/zones`,
			body: {
				name: normalizePowerDnsZone(input.zone),
				kind: input.kind ?? 'Native',
				masters: input.masters,
				nameservers: input.nameservers?.map((value) => normalizePowerDnsZone(value)) ?? [],
				account: input.account,
				dnssec: input.dnssec,
			},
		};
	}
	async createZone(input: PowerDnsCreateZoneInput, options?: PowerDnsRequestOptions) {
		return this.#resource('create zone', this.prepareCreateZone(input), options);
	}
	async deleteZone(input: PowerDnsZoneInput, options?: PowerDnsRequestOptions): Promise<void> {
		await this.#send('delete zone', { method: 'DELETE', path: this.#zone(input) }, options);
	}
	async notifyZone(input: PowerDnsZoneInput, options?: PowerDnsRequestOptions) {
		return this.#send('notify zone', { method: 'PUT', path: `${this.#zone(input)}/notify` }, options);
	}
	async retrieveZoneAxfr(input: PowerDnsZoneInput, options?: PowerDnsRequestOptions) {
		return this.#send('retrieve zone', { method: 'PUT', path: `${this.#zone(input)}/axfr-retrieve` }, options);
	}

	/** Builds the RRSet REPLACE patch without sending it; used for dry-run previews. */
	prepareReplaceRrset(input: PowerDnsReplaceRrsetInput): PowerDnsPreparedRequest {
		if (!Number.isSafeInteger(input.ttl) || input.ttl < 0) invalid('PowerDNS RRSet TTL is invalid');
		if (!Array.isArray(input.records) || !input.records.length) invalid('PowerDNS RRSet records are required');
		return {
			method: 'PATCH',
			path: this.#zone(input),
			body: {
				rrsets: [
					{
						name: normalizePowerDnsRecordName(input.name, input.zone),
						type: text(input.type, 'record type', 32).toUpperCase(),
						changetype: 'REPLACE',
						ttl: input.ttl,
						records: input.records.map((record) => {
							if (typeof record.content !== 'string' || !record.content || record.content.length > 65_535) invalid('PowerDNS record content is invalid');
							return { content: record.content, disabled: Boolean(record.disabled) };
						}),
						...(input.comments
							? {
									comments: input.comments.map((comment) => ({
										content: comment.content,
										account: comment.account ?? '',
										modified_at: comment.modifiedAt ?? Math.floor(Date.now() / 1000),
									})),
								}
							: {}),
					},
				],
			},
		};
	}
	async replaceRrset(input: PowerDnsReplaceRrsetInput, options?: PowerDnsRequestOptions): Promise<void> {
		await this.#send('replace RRSet', this.prepareReplaceRrset(input), options);
	}

	/** Builds the RRSet DELETE patch without sending it. */
	prepareDeleteRrset(input: PowerDnsDeleteRrsetInput): PowerDnsPreparedRequest {
		return {
			method: 'PATCH',
			path: this.#zone(input),
			body: {
				rrsets: [
					{
						name: normalizePowerDnsRecordName(input.name, input.zone),
						type: text(input.type, 'record type', 32).toUpperCase(),
						changetype: 'DELETE',
					},
				],
			},
		};
	}
	async deleteRrset(input: PowerDnsDeleteRrsetInput, options?: PowerDnsRequestOptions): Promise<void> {
		await this.#send('delete RRSet', this.prepareDeleteRrset(input), options);
	}

	async listMetadata(input: PowerDnsZoneInput, options?: PowerDnsRequestOptions) {
		return this.#list('list metadata', { method: 'GET', path: `${this.#zone(input)}/metadata` }, options);
	}
	async getMetadata(input: PowerDnsMetadataInput, options?: PowerDnsRequestOptions) {
		return this.#resource('get metadata', { method: 'GET', path: `${this.#zone(input)}/metadata/${enc(text(input.kind, 'metadata kind', 256))}` }, options);
	}
	async setMetadata(input: PowerDnsSetMetadataInput, options?: PowerDnsRequestOptions) {
		const kind = text(input.kind, 'metadata kind', 256);
		if (!Array.isArray(input.values) || input.values.some((value) => typeof value !== 'string')) invalid('PowerDNS metadata values are invalid');
		return this.#resource('set metadata', { method: 'PUT', path: `${this.#zone(input)}/metadata/${enc(kind)}`, body: { kind, metadata: input.values } }, options);
	}
	async deleteMetadata(input: PowerDnsMetadataInput, options?: PowerDnsRequestOptions): Promise<void> {
		await this.#send('delete metadata', { method: 'DELETE', path: `${this.#zone(input)}/metadata/${enc(text(input.kind, 'metadata kind', 256))}` }, options);
	}

	#cryptokey(input: PowerDnsCryptokeyInput): string {
		if (!Number.isSafeInteger(input.id) || input.id < 0) invalid('PowerDNS cryptokey id is invalid');
		return `${this.#zone(input)}/cryptokeys/${enc(input.id)}`;
	}
	async listCryptokey(input: PowerDnsZoneInput, options?: PowerDnsRequestOptions) {
		return this.#list('list cryptokeys', { method: 'GET', path: `${this.#zone(input)}/cryptokeys` }, options);
	}
	async getCryptokey(input: PowerDnsCryptokeyInput, options?: PowerDnsRequestOptions) {
		return this.#resource('get cryptokey', { method: 'GET', path: this.#cryptokey(input) }, options);
	}
	async createCryptokey(input: PowerDnsCreateCryptokeyInput, options?: PowerDnsRequestOptions) {
		if (input.bits !== undefined && (!Number.isSafeInteger(input.bits) || input.bits < 1)) invalid('PowerDNS key size is invalid');
		const body = { keytype: input.keytype ?? 'csk', active: input.active ?? true, published: input.published, algorithm: input.algorithm, bits: input.bits };
		return this.#resource('create cryptokey', { method: 'POST', path: `${this.#zone(input)}/cryptokeys`, body }, options);
	}
	async updateCryptokey(input: PowerDnsUpdateCryptokeyInput, options?: PowerDnsRequestOptions): Promise<void> {
		if (input.active === undefined && input.published === undefined) invalid('PowerDNS cryptokey update requires active or published');
		await this.#send('update cryptokey', { method: 'PUT', path: this.#cryptokey(input), body: { active: input.active, published: input.published } }, options);
	}
	async deleteCryptokey(input: PowerDnsCryptokeyInput, options?: PowerDnsRequestOptions): Promise<void> {
		await this.#send('delete cryptokey', { method: 'DELETE', path: this.#cryptokey(input) }, options);
	}

	#tsig(input: PowerDnsTsigKeyInput): string {
		return `${this.#server(input)}/tsigkeys/${enc(text(input.id, 'TSIG key id', 1024))}`;
	}
	async listTsigKey(input: PowerDnsServerInput = {}, options?: PowerDnsRequestOptions) {
		return this.#list('list TSIG keys', { method: 'GET', path: `${this.#server(input)}/tsigkeys` }, options);
	}
	async getTsigKey(input: PowerDnsTsigKeyInput, options?: PowerDnsRequestOptions) {
		return this.#resource('get TSIG key', { method: 'GET', path: this.#tsig(input) }, options);
	}
	async createTsigKey(input: PowerDnsCreateTsigKeyInput, options?: PowerDnsRequestOptions) {
		const body = { name: text(input.name, 'TSIG key name'), algorithm: input.algorithm ?? 'hmac-sha256', key: input.key };
		return this.#resource('create TSIG key', { method: 'POST', path: `${this.#server(input)}/tsigkeys`, body }, options);
	}
	async updateTsigKey(input: PowerDnsUpdateTsigKeyInput, options?: PowerDnsRequestOptions) {
		const body = { name: input.name, algorithm: input.algorithm, key: input.key };
		if (Object.values(body).every((value) => value === undefined)) invalid('PowerDNS TSIG key update requires a change');
		return this.#resource('update TSIG key', { method: 'PUT', path: this.#tsig(input), body }, options);
	}
	async deleteTsigKey(input: PowerDnsTsigKeyInput, options?: PowerDnsRequestOptions): Promise<void> {
		await this.#send('delete TSIG key', { method: 'DELETE', path: this.#tsig(input) }, options);
	}

	/** Restricted raw API passthrough: path relative to `/api/v1`, see `isSafePowerDnsPath`. */
	async request(input: PowerDnsRawRequestInput, options?: PowerDnsRequestOptions): Promise<unknown> {
		let path = input.path;
		if (typeof path === 'string' && /^\/api\/v1(\/|$)/u.test(path)) path = path.slice('/api/v1'.length) || '/';
		if (!isSafePowerDnsPath(path)) invalid('PowerDNS API path is invalid');
		const method = resolvePowerDnsMethod(input);
		if ((method === 'GET' || method === 'HEAD') && input.body !== undefined) invalid('PowerDNS GET or HEAD request cannot have a body');
		return this.#send('API', { method, path, query: input.query, body: input.body }, options);
	}

	async close(): Promise<void> {
		if (this.#closed) return;
		this.#closed = true;
		for (const abort of [...this.#active]) abort();
		this.#active.clear();
	}
}
