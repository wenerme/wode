import { type FetchLike, getGlobalThis } from '@wener/utils';

export const DefaultHonchoBaseUrl = 'https://api.honcho.dev';
export const DefaultHonchoApiPrefix = '/v3';

export type HonchoJsonObject = Record<string, unknown>;
export type HonchoReasoningLevel = 'minimal' | 'low' | 'medium' | 'high' | 'max' | (string & {});

export interface HonchoPageResponse<T> {
	items?: T[];
	total?: number;
	page?: number;
	size?: number;
	pages?: number;
	[key: string]: unknown;
}

export interface HonchoWorkspace {
	id?: string;
	name?: string;
	metadata?: HonchoJsonObject;
	configuration?: HonchoJsonObject;
	created_at?: string;
	[key: string]: unknown;
}

export interface HonchoPeer {
	id?: string;
	name?: string;
	workspace_id?: string;
	metadata?: HonchoJsonObject;
	configuration?: HonchoJsonObject;
	created_at?: string;
	[key: string]: unknown;
}

export interface HonchoSession {
	id?: string;
	name?: string;
	workspace_id?: string;
	metadata?: HonchoJsonObject;
	configuration?: HonchoJsonObject;
	is_active?: boolean;
	created_at?: string;
	[key: string]: unknown;
}

export interface HonchoMessage {
	id?: string;
	public_id?: string;
	peer_id?: string;
	peer_name?: string;
	session_id?: string;
	content?: string;
	metadata?: HonchoJsonObject;
	created_at?: string;
	token_count?: number;
	[key: string]: unknown;
}

export interface HonchoSummary {
	content?: string;
	message_id?: string | number;
	message_public_id?: string;
	summary_type?: string;
	created_at?: string;
	token_count?: number;
	[key: string]: unknown;
}

export interface HonchoSessionSummaries {
	id?: string;
	name?: string;
	short_summary?: HonchoSummary | null;
	long_summary?: HonchoSummary | null;
	[key: string]: unknown;
}

export interface HonchoSessionContext {
	id?: string;
	name?: string;
	messages?: HonchoMessage[];
	summary?: HonchoSummary | null;
	peer_representation?: string | null;
	peer_card?: string[] | null;
	[key: string]: unknown;
}

export interface HonchoConclusion {
	id?: string;
	content?: string;
	observer_id?: string;
	observer?: string;
	observed_id?: string;
	observed?: string;
	session_id?: string;
	session_name?: string;
	created_at?: string;
	distance?: number;
	source_ids?: string[];
	level?: string;
	[key: string]: unknown;
}

export interface HonchoQueueStatus {
	total_work_units?: number;
	completed_work_units?: number;
	in_progress_work_units?: number;
	pending_work_units?: number;
	sessions?: Record<string, unknown> | null;
	[key: string]: unknown;
}

export interface HonchoWebhookEndpoint {
	id?: string;
	workspace_id?: string;
	url?: string;
	created_at?: string;
	[key: string]: unknown;
}

export interface HonchoCreateWorkspaceRequest {
	id?: string;
	metadata?: HonchoJsonObject;
	configuration?: HonchoJsonObject;
	[key: string]: unknown;
}

export interface HonchoCreatePeerRequest {
	id?: string;
	metadata?: HonchoJsonObject;
	configuration?: HonchoJsonObject;
	[key: string]: unknown;
}

export interface HonchoCreateSessionRequest {
	id?: string;
	metadata?: HonchoJsonObject;
	configuration?: HonchoJsonObject;
	peers?: Record<string, HonchoJsonObject>;
	[key: string]: unknown;
}

export interface HonchoCreateMessageInput {
	peer_id: string;
	content: string;
	metadata?: HonchoJsonObject;
	[key: string]: unknown;
}

export interface HonchoCreateMessagesRequest {
	messages: HonchoCreateMessageInput[];
}

export interface HonchoCreateConclusionsRequest {
	conclusions: Array<{
		observer_id: string;
		observed_id: string;
		content: string;
		session_id?: string;
		[key: string]: unknown;
	}>;
}

export interface HonchoConclusionQueryRequest {
	query: string;
	top_k?: number;
	filters?: HonchoJsonObject;
	[key: string]: unknown;
}

export interface HonchoPeerRepresentationRequest {
	target?: string;
	search_query?: string;
	search_top_k?: number;
	max_conclusions?: number;
	[key: string]: unknown;
}

export interface HonchoPeerChatRequest {
	query: string;
	session_id?: string;
	target?: string;
	stream?: boolean;
	reasoning_level?: HonchoReasoningLevel;
	[key: string]: unknown;
}

export interface HonchoPeerChatResponse {
	content?: string;
	[key: string]: unknown;
}

export interface HonchoScheduleDreamRequest {
	observer: string;
	observed?: string;
	dream_type?: 'explicit' | 'deductive' | 'inductive' | (string & {});
	[key: string]: unknown;
}

export interface HonchoCreateKeyRequest {
	workspace_id?: string;
	peer_id?: string;
	session_id?: string;
	admin?: boolean;
	[key: string]: unknown;
}

/** Per-call transport options accepted by structured client methods. */
export interface HonchoCallOptions {
	signal?: AbortSignal;
	timeout?: number;
}

export interface HonchoListOptions extends HonchoCallOptions {
	size?: number;
	page?: number;
	filters?: HonchoJsonObject;
}

export interface HonchoRequestOptions<TBody = unknown> {
	method?: string;
	path: string;
	query?: Record<string, unknown>;
	body?: TBody;
	headers?: Record<string, string>;
	signal?: AbortSignal;
	timeout?: number;
}

export interface HonchoClientOptions {
	apiKey?: string;
	baseUrl: string;
	apiPrefix: string;
	fetch: FetchLike;
	headers: Record<string, string>;
	timeout?: number;
}

export interface HonchoClientInit extends Partial<HonchoClientOptions> {}

export class HonchoClientError extends Error {
	readonly status?: number;
	readonly statusText?: string;
	readonly data?: unknown;
	readonly response?: Response;

	constructor(
		message: string,
		options: { status?: number; statusText?: string; data?: unknown; response?: Response } = {},
	) {
		super(message);
		this.name = 'HonchoClientError';
		this.status = options.status;
		this.statusText = options.statusText;
		this.data = options.data;
		this.response = options.response;
	}
}

function trimSlashes(value: string): string {
	return value.replace(/^\/+|\/+$/g, '');
}

export function normalizeHonchoEndpoint(
	baseUrl = DefaultHonchoBaseUrl,
	apiPrefix = DefaultHonchoApiPrefix,
): { baseUrl: string; apiPrefix: string } {
	const cleanPrefix = trimSlashes(apiPrefix || DefaultHonchoApiPrefix);
	try {
		const url = new URL(baseUrl);
		const cleanPath = url.pathname.replace(/\/+$/g, '');
		const suffix = `/${cleanPrefix}`;
		if (cleanPath === suffix || cleanPath.endsWith(suffix)) {
			url.pathname = cleanPath.slice(0, -suffix.length) || '/';
			return { baseUrl: url.toString().replace(/\/$/g, ''), apiPrefix: `/${cleanPrefix}` };
		}
	} catch {
		// Keep invalid/relative baseUrl as-is; request URL construction will surface errors later.
	}
	return { baseUrl, apiPrefix: `/${cleanPrefix}` };
}

function resolveHonchoUrl(baseUrl: string, apiPrefix: string, path: string, query?: Record<string, unknown>): string {
	const endpoint = normalizeHonchoEndpoint(baseUrl, apiPrefix);
	const base = endpoint.baseUrl.endsWith('/') ? endpoint.baseUrl : `${endpoint.baseUrl}/`;
	const cleanPrefix = trimSlashes(endpoint.apiPrefix || DefaultHonchoApiPrefix);
	const cleanPath = trimSlashes(path);
	const url = new URL([cleanPrefix, cleanPath].filter(Boolean).join('/'), base);
	for (const [key, value] of Object.entries(query ?? {})) {
		if (value === undefined || value === null || value === '') continue;
		if (Array.isArray(value)) {
			for (const item of value)
				if (item !== undefined && item !== null && item !== '') url.searchParams.append(key, String(item));
			continue;
		}
		url.searchParams.set(key, String(value));
	}
	return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function errorMessageFromData(data: unknown): string | undefined {
	if (typeof data === 'string') return data;
	if (!isRecord(data)) return undefined;
	const detail = data.detail;
	if (typeof detail === 'string') return detail;
	if (Array.isArray(detail))
		return detail.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('; ');
	const error = data.error;
	if (typeof error === 'string') return error;
	if (isRecord(error) && typeof error.message === 'string') return error.message;
	if (typeof data.message === 'string') return data.message;
	return undefined;
}

async function parseResponseBody(response: Response): Promise<unknown> {
	const text = await response.text();
	if (!text) return undefined;
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return text;
	}
}

function combineSignals(left: AbortSignal | undefined, right: AbortSignal | undefined): AbortSignal | undefined {
	if (!left) return right;
	if (!right) return left;
	return AbortSignal.any([left, right]);
}

/**
 * Accepts a relative Honcho API path such as `/workspaces/list`; rejects absolute URLs,
 * query/fragment markers, backslashes, control characters and dot segments so a raw
 * request cannot escape the configured API prefix.
 */
export function isSafeHonchoPath(path: string): boolean {
	if (!path || path.length > 2048) return false;
	if (/[?#\\\u0000-\u001f\u007f]/u.test(path) || path.includes('://')) return false;
	const segments = path.replace(/^\/+/u, '').split('/');
	for (const segment of segments) {
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

export function normalizeHonchoPage<T>(value: HonchoPageResponse<T> | T[] | undefined): T[] {
	if (!value) return [];
	if (Array.isArray(value)) return value;
	return value.items ?? [];
}

export function getHonchoResourceId(value: { id?: string; name?: string; public_id?: string } | undefined): string {
	return value?.id || value?.name || value?.public_id || 'unknown';
}

export class HonchoClient {
	readonly options: HonchoClientOptions;

	constructor({
		apiKey,
		baseUrl = DefaultHonchoBaseUrl,
		apiPrefix = DefaultHonchoApiPrefix,
		fetch = getGlobalThis().fetch,
		headers = {},
		timeout,
	}: HonchoClientInit = {}) {
		const endpoint = normalizeHonchoEndpoint(baseUrl, apiPrefix);
		this.options = { apiKey, baseUrl: endpoint.baseUrl, apiPrefix: endpoint.apiPrefix, fetch, headers, timeout };
	}

	async request<TResponse, TBody = unknown>({
		method,
		path,
		query,
		body,
		headers,
		signal,
		timeout,
	}: HonchoRequestOptions<TBody>): Promise<TResponse> {
		const timeoutMs = timeout ?? this.options.timeout;
		const timeoutController = timeoutMs ? new AbortController() : undefined;
		const timer = timeoutMs ? setTimeout(() => timeoutController?.abort(), timeoutMs) : undefined;
		const requestHeaders = new Headers({ Accept: 'application/json', ...this.options.headers, ...headers });
		if (this.options.apiKey && !requestHeaders.has('authorization'))
			requestHeaders.set('authorization', `Bearer ${this.options.apiKey}`);
		if (body !== undefined && !requestHeaders.has('content-type'))
			requestHeaders.set('content-type', 'application/json');
		try {
			const response = await this.options.fetch(
				resolveHonchoUrl(this.options.baseUrl, this.options.apiPrefix, path, query),
				{
					method: method ?? (body === undefined ? 'GET' : 'POST'),
					headers: requestHeaders,
					body: body === undefined ? undefined : JSON.stringify(body),
					signal: combineSignals(signal, timeoutController?.signal),
				},
			);
			const data = await parseResponseBody(response);
			if (!response.ok) {
				const detail = errorMessageFromData(data);
				const suffix = detail ? `: ${detail}` : '';
				throw new HonchoClientError(`Honcho request failed: ${response.status} ${response.statusText}${suffix}`, {
					status: response.status,
					statusText: response.statusText,
					data,
					response,
				});
			}
			return data as TResponse;
		} finally {
			if (timer) clearTimeout(timer);
		}
	}

	listWorkspaces(
		options: HonchoListOptions = {},
	): Promise<HonchoPageResponse<HonchoWorkspace>> {
		return this.request({
			path: 'workspaces/list',
			query: { size: options.size ?? 50, page: options.page },
			body: { filters: options.filters ?? {} },
			signal: options.signal,
			timeout: options.timeout,
		});
	}

	createWorkspace(body: HonchoCreateWorkspaceRequest, options: HonchoCallOptions = {}): Promise<HonchoWorkspace> {
		return this.request({ path: 'workspaces', body, ...options });
	}

	listPeers(
		workspaceId: string,
		options: HonchoListOptions = {},
	): Promise<HonchoPageResponse<HonchoPeer>> {
		return this.request({
			path: `workspaces/${encodeURIComponent(workspaceId)}/peers/list`,
			query: { size: options.size ?? 80, page: options.page },
			body: { filters: options.filters ?? {} },
			signal: options.signal,
			timeout: options.timeout,
		});
	}

	createPeer(workspaceId: string, body: HonchoCreatePeerRequest, options: HonchoCallOptions = {}): Promise<HonchoPeer> {
		return this.request({ path: `workspaces/${encodeURIComponent(workspaceId)}/peers`, body, ...options });
	}

	listSessions(
		workspaceId: string,
		options: HonchoListOptions = {},
	): Promise<HonchoPageResponse<HonchoSession>> {
		return this.request({
			path: `workspaces/${encodeURIComponent(workspaceId)}/sessions/list`,
			query: { size: options.size ?? 80, page: options.page },
			body: { filters: options.filters ?? {} },
			signal: options.signal,
			timeout: options.timeout,
		});
	}

	createSession(workspaceId: string, body: HonchoCreateSessionRequest, options: HonchoCallOptions = {}): Promise<HonchoSession> {
		return this.request({ path: `workspaces/${encodeURIComponent(workspaceId)}/sessions`, body, ...options });
	}

	listSessionMessages(
		workspaceId: string,
		sessionId: string,
		options: HonchoListOptions = {},
	): Promise<HonchoPageResponse<HonchoMessage>> {
		return this.request({
			path: `workspaces/${encodeURIComponent(workspaceId)}/sessions/${encodeURIComponent(sessionId)}/messages/list`,
			query: { size: options.size ?? 100, page: options.page },
			body: { filters: options.filters ?? {} },
			signal: options.signal,
			timeout: options.timeout,
		});
	}

	createSessionMessages(
		workspaceId: string,
		sessionId: string,
		body: HonchoCreateMessagesRequest,
		options: HonchoCallOptions = {},
	): Promise<HonchoMessage[]> {
		return this.request({
			path: `workspaces/${encodeURIComponent(workspaceId)}/sessions/${encodeURIComponent(sessionId)}/messages`,
			body,
			...options,
		});
	}

	listSessionPeers(workspaceId: string, sessionId: string): Promise<HonchoPeer[]> {
		return this.request({
			path: `workspaces/${encodeURIComponent(workspaceId)}/sessions/${encodeURIComponent(sessionId)}/peers`,
		});
	}

	getSessionSummaries(
		workspaceId: string,
		sessionId: string,
		options: HonchoCallOptions = {},
	): Promise<HonchoSessionSummaries> {
		return this.request({
			path: `workspaces/${encodeURIComponent(workspaceId)}/sessions/${encodeURIComponent(sessionId)}/summaries`,
			...options,
		});
	}

	getSessionContext(
		workspaceId: string,
		sessionId: string,
		options: { tokens?: number; summary?: boolean } & HonchoCallOptions = {},
	): Promise<HonchoSessionContext> {
		return this.request({
			path: `workspaces/${encodeURIComponent(workspaceId)}/sessions/${encodeURIComponent(sessionId)}/context`,
			query: { tokens: options.tokens, summary: options.summary },
			signal: options.signal,
			timeout: options.timeout,
		});
	}

	listConclusions(
		workspaceId: string,
		options: HonchoListOptions = {},
	): Promise<HonchoPageResponse<HonchoConclusion>> {
		return this.request({
			path: `workspaces/${encodeURIComponent(workspaceId)}/conclusions/list`,
			query: { size: options.size ?? 80, page: options.page },
			body: { filters: options.filters ?? {} },
			signal: options.signal,
			timeout: options.timeout,
		});
	}

	createConclusions(workspaceId: string, body: HonchoCreateConclusionsRequest): Promise<HonchoConclusion[]> {
		return this.request({ path: `workspaces/${encodeURIComponent(workspaceId)}/conclusions`, body });
	}

	queryConclusions(
		workspaceId: string,
		body: HonchoConclusionQueryRequest,
		options: HonchoCallOptions = {},
	): Promise<HonchoConclusion[]> {
		return this.request({ path: `workspaces/${encodeURIComponent(workspaceId)}/conclusions/query`, body, ...options });
	}

	getPeerCard(workspaceId: string, peerId: string, target?: string): Promise<{ peer_card?: string[] }> {
		return this.request({
			path: `workspaces/${encodeURIComponent(workspaceId)}/peers/${encodeURIComponent(peerId)}/card`,
			query: { target },
		});
	}

	setPeerCard(
		workspaceId: string,
		peerId: string,
		peerCard: string[],
		target?: string,
	): Promise<{ peer_card?: string[] }> {
		return this.request({
			method: 'PUT',
			path: `workspaces/${encodeURIComponent(workspaceId)}/peers/${encodeURIComponent(peerId)}/card`,
			query: { target },
			body: { peer_card: peerCard },
		});
	}

	getPeerRepresentation(
		workspaceId: string,
		peerId: string,
		body: HonchoPeerRepresentationRequest = {},
	): Promise<{ representation?: string }> {
		return this.request({
			path: `workspaces/${encodeURIComponent(workspaceId)}/peers/${encodeURIComponent(peerId)}/representation`,
			body,
		});
	}

	getPeerContext(
		workspaceId: string,
		peerId: string,
		options: { target?: string; search_query?: string; max_conclusions?: number } = {},
	): Promise<HonchoJsonObject> {
		return this.request({
			path: `workspaces/${encodeURIComponent(workspaceId)}/peers/${encodeURIComponent(peerId)}/context`,
			query: options,
		});
	}

	listPeerSessions(
		workspaceId: string,
		peerId: string,
		options: HonchoListOptions = {},
	): Promise<HonchoPageResponse<HonchoSession>> {
		return this.request({
			path: `workspaces/${encodeURIComponent(workspaceId)}/peers/${encodeURIComponent(peerId)}/sessions`,
			query: { size: options.size ?? 50, page: options.page },
			body: { filters: options.filters ?? {} },
			signal: options.signal,
			timeout: options.timeout,
		});
	}

	searchPeerMessages(workspaceId: string, peerId: string, query: string, limit = 30): Promise<HonchoMessage[]> {
		return this.request({
			path: `workspaces/${encodeURIComponent(workspaceId)}/peers/${encodeURIComponent(peerId)}/search`,
			body: { query, limit },
		});
	}

	chat(
		workspaceId: string,
		observerPeerId: string,
		body: HonchoPeerChatRequest,
		options: HonchoCallOptions = {},
	): Promise<HonchoPeerChatResponse> {
		return this.request({
			path: `workspaces/${encodeURIComponent(workspaceId)}/peers/${encodeURIComponent(observerPeerId)}/chat`,
			body: { stream: false, ...body },
			...options,
		});
	}

	getQueueStatus(workspaceId: string, options: HonchoCallOptions = {}): Promise<HonchoQueueStatus> {
		return this.request({ path: `workspaces/${encodeURIComponent(workspaceId)}/queue/status`, ...options });
	}

	scheduleDream(workspaceId: string, body: HonchoScheduleDreamRequest): Promise<void> {
		return this.request({ path: `workspaces/${encodeURIComponent(workspaceId)}/schedule_dream`, body });
	}

	listWebhooks(workspaceId: string, size = 50): Promise<HonchoPageResponse<HonchoWebhookEndpoint>> {
		return this.request({ path: `workspaces/${encodeURIComponent(workspaceId)}/webhooks`, query: { size } });
	}

	createWebhook(workspaceId: string, url: string): Promise<HonchoWebhookEndpoint> {
		return this.request({ path: `workspaces/${encodeURIComponent(workspaceId)}/webhooks`, body: { url } });
	}

	createKey(body: HonchoCreateKeyRequest): Promise<HonchoJsonObject> {
		return this.request({ path: 'keys', body });
	}
}
