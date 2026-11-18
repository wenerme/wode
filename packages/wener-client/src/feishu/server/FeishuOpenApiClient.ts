import type { FetchLike } from '@wener/utils';

/**
 * Typed, stateless subset of the Feishu/Lark OpenAPI backed by a tenant access token.
 *
 * - The token lives only in this instance's memory; nothing is persisted.
 * - Every call, including the token exchange, uses the injected fetch and the caller's signal.
 * - Error messages never include the request URL, headers, token or app secret.
 * - Response bodies (JSON and binary) are read with an explicit byte limit.
 */

export const FEISHU_OPEN_API_BASE_URL = 'https://open.feishu.cn/open-apis/';
/** Feishu documented limits for IM uploads. */
export const FEISHU_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const FEISHU_MAX_FILE_BYTES = 30 * 1024 * 1024;
/** Default and maximum size accepted for a downloaded message resource. */
export const FEISHU_MAX_RESOURCE_BYTES = 30 * 1024 * 1024;
const MAX_JSON_BYTES = 8 * 1024 * 1024;
const TOKEN_REFRESH_WINDOW_MS = 5 * 60 * 1000;
/** Codes reporting an invalid or expired tenant access token; the cached token is dropped and the call retried once. */
export const FEISHU_TOKEN_INVALID_CODES: ReadonlySet<number> = new Set([99991661, 99991663, 99991668]);

export type FeishuUserIdType = 'open_id' | 'union_id' | 'user_id';
export type FeishuFileType = 'opus' | 'mp4' | 'pdf' | 'doc' | 'xls' | 'ppt' | 'stream';
export type FeishuRecord = Record<string, unknown>;

export interface FeishuPage<T = FeishuRecord> {
	items: T[];
	hasMore: boolean;
	pageToken?: string;
}

export interface FeishuCallOptions {
	signal?: AbortSignal;
}

export interface FeishuOpenApiClientOptions {
	appId: string;
	appSecret: string;
	fetch?: FetchLike;
	/** Defaults to the Feishu (China) endpoint; use `https://open.larksuite.com/open-apis/` for Lark. */
	baseUrl?: string;
	/** Clock used for token expiry; injectable for tests. */
	now?: () => number;
}

export interface FeishuResource {
	data: Uint8Array;
	contentType?: string;
	filename?: string;
}

export class FeishuOpenApiError extends Error {
	override name = 'FeishuOpenApiError';
	readonly status?: number;
	readonly code?: number;
	readonly logId?: string;

	constructor(message: string, detail: { status?: number; code?: number; logId?: string } = {}) {
		super(message);
		this.status = detail.status;
		this.code = detail.code;
		this.logId = detail.logId;
	}
}

function isRecord(value: unknown): value is FeishuRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function scrub(value: string): string {
	return value
		.replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/giu, '$1 <redacted>')
		.replace(/\b[tu]-[A-Za-z0-9._-]{8,}/gu, '<redacted>')
		.replace(
			/(tenant_access_token|user_access_token|app_access_token|access_token|refresh_token|app_secret|secret|token|authorization)(["'\s]*[=:]\s*["']?)[^\s"',}]+/giu,
			'$1$2<redacted>',
		);
}

function failure(prefix: string, status: number | undefined, body: unknown): FeishuOpenApiError {
	const record = isRecord(body) ? body : {};
	const code = typeof record.code === 'number' ? record.code : undefined;
	const rawMsg = typeof record.msg === 'string' ? record.msg : typeof record.message === 'string' ? record.message : undefined;
	const msg = rawMsg ? scrub(rawMsg).slice(0, 200) : undefined;
	const error = isRecord(record.error) ? record.error : {};
	const logId = typeof error.log_id === 'string' && /^[A-Za-z0-9_-]{1,128}$/u.test(error.log_id) ? error.log_id : undefined;
	const detail = [
		status !== undefined ? `HTTP ${status}` : undefined,
		code !== undefined ? `code=${code}` : undefined,
		msg ? `msg=${msg}` : undefined,
		logId ? `log_id=${logId}` : undefined,
	].filter(Boolean);
	return new FeishuOpenApiError(`${prefix}${detail.length ? ` (${detail.join(', ')})` : ''}`, { status, code, logId });
}

function segment(name: string, value: string): string {
	if (typeof value !== 'string' || !value.trim()) throw new FeishuOpenApiError(`Feishu ${name} is required`);
	return encodeURIComponent(value);
}

async function readBounded(response: Response, maxBytes: number, signal?: AbortSignal): Promise<Uint8Array> {
	const declared = Number(response.headers.get('content-length'));
	if (Number.isFinite(declared) && declared > maxBytes) {
		await response.body?.cancel().catch(() => undefined);
		throw new FeishuOpenApiError('Feishu response exceeds size limit');
	}
	if (!response.body) {
		const bytes = new Uint8Array(await response.arrayBuffer());
		if (bytes.byteLength > maxBytes) throw new FeishuOpenApiError('Feishu response exceeds size limit');
		return bytes;
	}
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	try {
		for (;;) {
			signal?.throwIfAborted();
			const { done, value } = await reader.read();
			if (done) break;
			total += value.byteLength;
			if (total > maxBytes) {
				await reader.cancel().catch(() => undefined);
				throw new FeishuOpenApiError('Feishu response exceeds size limit');
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	const result = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return result;
}

/** Marks a non-empty body that is not valid JSON, so callers can tell it apart from an empty body. */
const INVALID_JSON: unique symbol = Symbol('invalid-json');

async function readJson(response: Response, signal?: AbortSignal): Promise<unknown> {
	const text = new TextDecoder().decode(await readBounded(response, MAX_JSON_BYTES, signal));
	if (!text.trim()) return undefined;
	try {
		return JSON.parse(text);
	} catch {
		return INVALID_JSON;
	}
}

/** Only a base name is kept; path separators and control characters are removed. */
export function parseContentDispositionFilename(header: string | null | undefined): string | undefined {
	if (!header) return undefined;
	let name: string | undefined;
	const extended = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/u.exec(header);
	if (extended) {
		try {
			name = decodeURIComponent(extended[1].trim());
		} catch {
			name = undefined;
		}
	}
	if (!name) name = /filename\s*=\s*"([^"]*)"/u.exec(header)?.[1] ?? /filename\s*=\s*([^;\s]+)/u.exec(header)?.[1];
	if (!name) return undefined;
	const base = name.split(/[\\/]/u).pop() ?? '';
	// biome-ignore lint/suspicious/noControlCharactersInRegex: strip control characters from remote names
	const clean = base.replace(/[\u0000-\u001f\u007f]/gu, '').trim().slice(0, 255);
	return clean && clean !== '.' && clean !== '..' ? clean : undefined;
}

function page<T>(data: FeishuRecord): FeishuPage<T> {
	const items = Array.isArray(data.items) ? (data.items as T[]) : [];
	const pageToken = typeof data.page_token === 'string' && data.page_token ? data.page_token : undefined;
	return { items, hasMore: data.has_more === true, ...(pageToken ? { pageToken } : {}) };
}

function bytesOf(value: Uint8Array, label: string, maxBytes: number): Uint8Array<ArrayBuffer> {
	if (!(value instanceof Uint8Array) || value.byteLength === 0) throw new FeishuOpenApiError(`Feishu ${label} must not be empty`);
	if (value.byteLength > maxBytes) throw new FeishuOpenApiError(`Feishu ${label} exceeds size limit`);
	// Copy into a plain ArrayBuffer-backed view so Blob accepts it in every runtime.
	return new Uint8Array(value);
}

type QueryValue = string | number | boolean;
export type FeishuQuery = Record<string, QueryValue | readonly QueryValue[] | undefined>;

interface CallRequest {
	method: string;
	path: string;
	query?: FeishuQuery;
	json?: unknown;
	/** Raw string body sent without a content type (generic request passthrough). */
	text?: string;
	form?: FormData;
}

export interface FeishuRequestParams {
	/**
	 * Relative OpenAPI path (`im/v1/messages`) or an absolute path under the API root
	 * (`/open-apis/im/v1/messages`, as produced by `buildFeishuApiRequest`); never another origin.
	 */
	path: string;
	/** Defaults to POST when a body is present, otherwise GET. */
	method?: string;
	/** Array values are sent as repeated parameters. */
	query?: FeishuQuery;
	/** Plain values are sent as JSON; strings are sent verbatim. Ignored for GET/HEAD. */
	body?: unknown;
}

export interface FeishuSendMessageParams {
	receiveId: string;
	receiveIdType: 'open_id' | 'union_id' | 'user_id' | 'email' | 'chat_id';
	msgType: string;
	/** JSON-encoded message content as required by `im/v1/messages`. */
	content: string;
	uuid?: string;
}

/** Wait for a shared promise while letting this caller's own signal abort only its own wait. */
function waitFor<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
	if (!signal) return promise;
	signal.throwIfAborted();
	return new Promise<T>((resolve, reject) => {
		const onAbort = () => reject(signal.reason);
		signal.addEventListener('abort', onAbort, { once: true });
		promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
	});
}

interface TokenExchange {
	promise: Promise<string>;
	controller: AbortController;
	waiters: number;
	settled: boolean;
}

export class FeishuOpenApiClient {
	readonly #appId: string;
	readonly #appSecret: string;
	readonly #fetch: FetchLike;
	readonly #baseUrl: string;
	readonly #now: () => number;
	#token?: { value: string; expiresAt: number };
	#exchange?: TokenExchange;

	constructor({ appId, appSecret, fetch = globalThis.fetch, baseUrl = FEISHU_OPEN_API_BASE_URL, now = Date.now }: FeishuOpenApiClientOptions) {
		if (!appId || !appSecret) throw new FeishuOpenApiError('Feishu appId and appSecret are required');
		this.#appId = appId;
		this.#appSecret = appSecret;
		this.#fetch = fetch;
		this.#baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
		this.#now = now;
	}

	/**
	 * Cached in memory and refreshed five minutes before expiry; never persisted.
	 * Concurrent callers share one in-flight exchange. Each caller's signal aborts only its own
	 * wait; the exchange itself is aborted once every waiting caller has gone away.
	 */
	async getTenantAccessToken(options: FeishuCallOptions = {}): Promise<string> {
		const cached = this.#token;
		if (cached && cached.expiresAt - TOKEN_REFRESH_WINDOW_MS > this.#now()) return cached.value;
		options.signal?.throwIfAborted();
		let exchange = this.#exchange;
		if (!exchange) {
			const controller = new AbortController();
			const entry: TokenExchange = { controller, waiters: 0, settled: false, promise: undefined as never };
			entry.promise = this.#requestToken(controller.signal).finally(() => {
				entry.settled = true;
				if (this.#exchange === entry) this.#exchange = undefined;
			});
			// Waiters observe the outcome; an abandoned exchange must not raise an unhandled rejection.
			entry.promise.catch(() => undefined);
			this.#exchange = exchange = entry;
		}
		const entry = exchange;
		entry.waiters++;
		try {
			return await waitFor(entry.promise, options.signal);
		} finally {
			entry.waiters--;
			if (entry.waiters === 0 && !entry.settled) {
				if (this.#exchange === entry) this.#exchange = undefined;
				entry.controller.abort(options.signal?.reason);
			}
		}
	}

	/** Drop the cached token if it is still the given value. */
	#invalidate(token: string): void {
		if (this.#token?.value === token) this.#token = undefined;
	}

	async #requestToken(signal: AbortSignal): Promise<string> {
		const response = await this.#fetch(new URL('auth/v3/tenant_access_token/internal', this.#baseUrl).toString(), {
			method: 'POST',
			headers: { 'content-type': 'application/json; charset=utf-8' },
			body: JSON.stringify({ app_id: this.#appId, app_secret: this.#appSecret }),
			signal,
		});
		const body = await readJson(response, signal);
		const record = isRecord(body) ? body : {};
		if (!response.ok || record.code !== 0) throw failure('Feishu tenant token request failed', response.status, body);
		const value = record.tenant_access_token;
		if (typeof value !== 'string' || !value) throw new FeishuOpenApiError('Feishu tenant token response is invalid');
		const expire = typeof record.expire === 'number' && record.expire > 0 ? record.expire : 0;
		this.#token = { value, expiresAt: this.#now() + expire * 1000 };
		return value;
	}

	#url(path: string, query?: CallRequest['query']): URL {
		const url = new URL(path, this.#baseUrl);
		const base = new URL(this.#baseUrl);
		// A path must not redirect the bearer token to another origin or outside the API root.
		if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
			throw new FeishuOpenApiError('Feishu OpenAPI path must be relative to the API base URL');
		}
		for (const [key, value] of Object.entries(query ?? {})) {
			if (value === undefined) continue;
			if (Array.isArray(value)) for (const entry of value) url.searchParams.append(key, String(entry));
			else url.searchParams.set(key, String(value));
		}
		return url;
	}

	/**
	 * Send with the tenant token and let `handle` read the response. When `handle` reports a
	 * token-invalid code, the cached token is dropped and the request is retried exactly once.
	 */
	async #call<T>(request: CallRequest, options: FeishuCallOptions, handle: (response: Response) => Promise<T>): Promise<T> {
		const url = this.#url(request.path, request.query);
		for (let attempt = 0; ; attempt++) {
			const token = await this.getTenantAccessToken(options);
			options.signal?.throwIfAborted();
			const headers: Record<string, string> = { authorization: `Bearer ${token}` };
			let body: BodyInit | undefined;
			if (request.form) body = request.form;
			else if (request.text !== undefined) body = request.text;
			else if (request.json !== undefined) {
				headers['content-type'] = 'application/json; charset=utf-8';
				body = JSON.stringify(request.json);
			}
			const response = await this.#fetch(url.toString(), { method: request.method, headers, body, signal: options.signal });
			try {
				return await handle(response);
			} catch (error) {
				if (attempt === 0 && error instanceof FeishuOpenApiError && error.code !== undefined && FEISHU_TOKEN_INVALID_CODES.has(error.code)) {
					this.#invalidate(token);
					continue;
				}
				throw error;
			}
		}
	}

	/** Full `{code, msg, data}` envelope of a successful JSON call. */
	async #envelope(request: CallRequest, options: FeishuCallOptions): Promise<FeishuRecord> {
		return this.#call(request, options, async (response) => {
			const body = await readJson(response, options.signal);
			const record = isRecord(body) ? body : undefined;
			if (!response.ok || !record || record.code !== 0) throw failure('Feishu OpenAPI request failed', response.status, body);
			return record;
		});
	}

	async #json(request: CallRequest, options: FeishuCallOptions): Promise<FeishuRecord> {
		const record = await this.#envelope(request, options);
		return isRecord(record.data) ? record.data : {};
	}

	/**
	 * Generic OpenAPI passthrough with the shared tenant token. JSON responses return the full
	 * envelope (non-zero `code` throws); `text/*` returns a string; anything else a bounded Blob.
	 */
	async request(params: FeishuRequestParams, options: FeishuCallOptions = {}): Promise<unknown> {
		const method = (params.method ?? (params.body !== undefined ? 'POST' : 'GET')).toUpperCase();
		const hasBody = params.body !== undefined && method !== 'GET' && method !== 'HEAD';
		const request: CallRequest = {
			method, path: params.path, query: params.query,
			...(hasBody ? typeof params.body === 'string' ? { text: params.body } : { json: params.body } : {}),
		};
		return this.#call(request, options, async (response) => {
			const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? '';
			if (contentType.includes('json')) {
				const body = await readJson(response, options.signal);
				if (body === INVALID_JSON) throw failure('Feishu OpenAPI returned invalid JSON', response.status, undefined);
				const record = isRecord(body) ? body : undefined;
				if (!response.ok || (record && typeof record.code === 'number' && record.code !== 0)) {
					throw failure('Feishu OpenAPI request failed', response.status, body);
				}
				return body;
			}
			if (!response.ok) {
				await response.body?.cancel().catch(() => undefined);
				throw failure('Feishu OpenAPI request failed', response.status, undefined);
			}
			const bytes = await readBounded(response, FEISHU_MAX_RESOURCE_BYTES, options.signal);
			if (contentType.startsWith('text/')) return new TextDecoder().decode(bytes);
			return new Blob([new Uint8Array(bytes)], contentType ? { type: contentType } : undefined);
		});
	}

	/** Send an IM message; returns the full `{code, msg, data}` envelope. */
	async sendMessage(params: FeishuSendMessageParams, options: FeishuCallOptions = {}): Promise<FeishuRecord> {
		segment('receive_id', params.receiveId);
		return this.#envelope({
			method: 'POST', path: 'im/v1/messages', query: { receive_id_type: params.receiveIdType },
			json: { receive_id: params.receiveId, msg_type: params.msgType, content: params.content, uuid: params.uuid },
		}, options);
	}

	async listChats(
		params: { userIdType?: FeishuUserIdType; sortType?: 'ByCreateTimeAsc' | 'ByActiveTimeDesc'; pageSize?: number; pageToken?: string } = {},
		options: FeishuCallOptions = {},
	): Promise<FeishuPage> {
		return this.#json({
			method: 'GET', path: 'im/v1/chats',
			query: { user_id_type: params.userIdType, sort_type: params.sortType, page_size: params.pageSize, page_token: params.pageToken },
		}, options).then((data) => page(data));
	}

	async getChat(params: { chatId: string; userIdType?: FeishuUserIdType }, options: FeishuCallOptions = {}): Promise<FeishuRecord> {
		const data = await this.#json({
			method: 'GET', path: `im/v1/chats/${segment('chat_id', params.chatId)}`, query: { user_id_type: params.userIdType },
		}, options);
		// The detail payload omits its own identifier; keep the requested one alongside it.
		return { chat_id: params.chatId, ...data };
	}

	async listChatMembers(
		params: { chatId: string; memberIdType?: FeishuUserIdType; pageSize?: number; pageToken?: string },
		options: FeishuCallOptions = {},
	): Promise<FeishuPage & { memberTotal?: number }> {
		const data = await this.#json({
			method: 'GET', path: `im/v1/chats/${segment('chat_id', params.chatId)}/members`,
			query: { member_id_type: params.memberIdType, page_size: params.pageSize, page_token: params.pageToken },
		}, options);
		return { ...page(data), ...(typeof data.member_total === 'number' ? { memberTotal: data.member_total } : {}) };
	}

	async getUser(
		params: { userId: string; userIdType?: FeishuUserIdType; departmentIdType?: 'department_id' | 'open_department_id' },
		options: FeishuCallOptions = {},
	): Promise<FeishuRecord> {
		const data = await this.#json({
			method: 'GET', path: `contact/v3/users/${segment('user_id', params.userId)}`,
			query: { user_id_type: params.userIdType, department_id_type: params.departmentIdType },
		}, options);
		return isRecord(data.user) ? data.user : {};
	}

	async batchGetUserId(
		params: { emails?: string[]; mobiles?: string[]; userIdType?: FeishuUserIdType; includeResigned?: boolean },
		options: FeishuCallOptions = {},
	): Promise<FeishuRecord[]> {
		if (!params.emails?.length && !params.mobiles?.length) throw new FeishuOpenApiError('Feishu email or mobile is required');
		const data = await this.#json({
			method: 'POST', path: 'contact/v3/users/batch_get_id', query: { user_id_type: params.userIdType },
			json: { emails: params.emails, mobiles: params.mobiles, include_resigned: params.includeResigned },
		}, options);
		return Array.isArray(data.user_list) ? data.user_list.filter(isRecord) : [];
	}

	async listMessages(
		params: {
			containerId: string;
			containerIdType?: 'chat' | 'thread';
			startTime?: string;
			endTime?: string;
			sortType?: 'ByCreateTimeAsc' | 'ByCreateTimeDesc';
			pageSize?: number;
			pageToken?: string;
		},
		options: FeishuCallOptions = {},
	): Promise<FeishuPage> {
		segment('container_id', params.containerId);
		return this.#json({
			method: 'GET', path: 'im/v1/messages',
			query: {
				container_id_type: params.containerIdType ?? 'chat', container_id: params.containerId,
				start_time: params.startTime, end_time: params.endTime, sort_type: params.sortType,
				page_size: params.pageSize, page_token: params.pageToken,
			},
		}, options).then((data) => page(data));
	}

	/** Merge-forwarded messages return several items. */
	async getMessage(params: { messageId: string; userIdType?: FeishuUserIdType }, options: FeishuCallOptions = {}): Promise<FeishuRecord[]> {
		const data = await this.#json({
			method: 'GET', path: `im/v1/messages/${segment('message_id', params.messageId)}`, query: { user_id_type: params.userIdType },
		}, options);
		return Array.isArray(data.items) ? data.items.filter(isRecord) : [];
	}

	async replyMessage(
		params: { messageId: string; msgType: string; content: string; replyInThread?: boolean; uuid?: string },
		options: FeishuCallOptions = {},
	): Promise<FeishuRecord> {
		return this.#json({
			method: 'POST', path: `im/v1/messages/${segment('message_id', params.messageId)}/reply`,
			json: { msg_type: params.msgType, content: params.content, reply_in_thread: params.replyInThread, uuid: params.uuid },
		}, options);
	}

	async deleteMessage(params: { messageId: string }, options: FeishuCallOptions = {}): Promise<void> {
		await this.#json({ method: 'DELETE', path: `im/v1/messages/${segment('message_id', params.messageId)}` }, options);
	}

	async addMessageReaction(params: { messageId: string; emojiType: string }, options: FeishuCallOptions = {}): Promise<FeishuRecord> {
		return this.#json({
			method: 'POST', path: `im/v1/messages/${segment('message_id', params.messageId)}/reactions`,
			json: { reaction_type: { emoji_type: params.emojiType } },
		}, options);
	}

	async deleteMessageReaction(params: { messageId: string; reactionId: string }, options: FeishuCallOptions = {}): Promise<FeishuRecord> {
		return this.#json({
			method: 'DELETE',
			path: `im/v1/messages/${segment('message_id', params.messageId)}/reactions/${segment('reaction_id', params.reactionId)}`,
		}, options);
	}

	async uploadImage(
		params: { image: Uint8Array; imageType?: 'message' | 'avatar'; filename?: string },
		options: FeishuCallOptions = {},
	): Promise<{ imageKey: string }> {
		const form = new FormData();
		form.append('image_type', params.imageType ?? 'message');
		form.append('image', new Blob([bytesOf(params.image, 'image', FEISHU_MAX_IMAGE_BYTES)]), params.filename || 'image');
		const data = await this.#json({ method: 'POST', path: 'im/v1/images', form }, options);
		if (typeof data.image_key !== 'string' || !data.image_key) throw new FeishuOpenApiError('Feishu image upload response is invalid');
		return { imageKey: data.image_key };
	}

	async uploadFile(
		params: { file: Uint8Array; fileType: FeishuFileType; fileName: string; duration?: number },
		options: FeishuCallOptions = {},
	): Promise<{ fileKey: string }> {
		if (!params.fileName?.trim()) throw new FeishuOpenApiError('Feishu file_name is required');
		const form = new FormData();
		form.append('file_type', params.fileType);
		form.append('file_name', params.fileName);
		if (params.duration !== undefined) form.append('duration', String(params.duration));
		form.append('file', new Blob([bytesOf(params.file, 'file', FEISHU_MAX_FILE_BYTES)]), params.fileName);
		const data = await this.#json({ method: 'POST', path: 'im/v1/files', form }, options);
		if (typeof data.file_key !== 'string' || !data.file_key) throw new FeishuOpenApiError('Feishu file upload response is invalid');
		return { fileKey: data.file_key };
	}

	/** Bounded download of an image or file attached to a message. */
	async getMessageResource(
		params: { messageId: string; fileKey: string; type: 'image' | 'file'; maxBytes?: number },
		options: FeishuCallOptions = {},
	): Promise<FeishuResource> {
		const maxBytes = Math.min(params.maxBytes ?? FEISHU_MAX_RESOURCE_BYTES, FEISHU_MAX_RESOURCE_BYTES);
		return this.#call({
			method: 'GET',
			path: `im/v1/messages/${segment('message_id', params.messageId)}/resources/${segment('file_key', params.fileKey)}`,
			query: { type: params.type },
		}, options, async (response) => {
			const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() || undefined;
			if (!response.ok) throw failure('Feishu resource download failed', response.status, await readJson(response, options.signal));
			const data = await readBounded(response, maxBytes, options.signal);
			if (contentType === 'application/json') {
				// A JSON body is an error only when it is a Feishu envelope with a non-zero code;
				// otherwise it is the resource itself (e.g. an attached .json file).
				let body: unknown;
				try {
					body = JSON.parse(new TextDecoder().decode(data));
				} catch {
					body = undefined;
				}
				if (isRecord(body) && typeof body.code === 'number' && body.code !== 0) {
					throw failure('Feishu resource download failed', response.status, body);
				}
			}
			const filename = parseContentDispositionFilename(response.headers.get('content-disposition'));
			return { data, ...(contentType ? { contentType } : {}), ...(filename ? { filename } : {}) };
		});
	}
}
