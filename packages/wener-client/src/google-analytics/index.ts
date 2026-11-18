import type { FetchLike } from '@wener/utils';
import {
	createGoogleServiceAccountAssertion,
	type GoogleAccessToken,
	type GoogleAnalyticsCredential,
	GoogleOAuthTokenUrl,
	parseGoogleServiceAccountKey,
} from './auth';
import { GoogleAnalyticsClientError } from './errors';

export * from './auth';
export * from './errors';

export const GoogleAnalyticsDataBaseUrl = 'https://analyticsdata.googleapis.com';
export const GoogleAnalyticsAdminBaseUrl = 'https://analyticsadmin.googleapis.com';

export type GoogleAnalyticsCredentialSource = GoogleAnalyticsCredential | (() => GoogleAnalyticsCredential | Promise<GoogleAnalyticsCredential>);

export interface GoogleAnalyticsClientOptions {
	/** Static credential or lazy resolver; resolvers run inside the request deadline. */
	credentials: GoogleAnalyticsCredentialSource;
	/** Billing/quota project sent as `x-goog-user-project`. */
	projectId?: string;
	dataBaseUrl?: string;
	adminBaseUrl?: string;
	fetch?: FetchLike;
	/** Whole-operation deadline (token exchange + API request). */
	timeoutMs?: number;
	maxResponseBytes?: number;
	/** Clock for token expiry; injectable for tests. */
	now?: () => number;
}

export interface GoogleAnalyticsRequestOptions {
	signal?: AbortSignal;
	timeoutMs?: number;
}

export type GoogleAnalyticsJson = Record<string, unknown>;

export interface GoogleAnalyticsDateRange {
	startDate: string;
	endDate: string;
	name?: string;
}
export interface GoogleAnalyticsAccountSummariesInput {
	pageSize?: number;
	pageToken?: string;
}
export interface GoogleAnalyticsPropertyInput {
	/** Numeric ID or `properties/<id>`. */
	propertyId: string | number;
}
interface GoogleAnalyticsReportCommon {
	/** Numeric ID or `properties/<id>`. */
	propertyId: string | number;
	dimensions: string[];
	metrics: string[];
	dimensionFilter?: Record<string, unknown>;
	metricFilter?: Record<string, unknown>;
	orderBys?: Record<string, unknown>[];
	limit?: number;
	returnPropertyQuota?: boolean;
}
export interface GoogleAnalyticsReportInput extends GoogleAnalyticsReportCommon {
	dateRanges: GoogleAnalyticsDateRange[];
	offset?: number;
	currencyCode?: string;
	keepEmptyRows?: boolean;
}
export type GoogleAnalyticsRealtimeReportInput = GoogleAnalyticsReportCommon;

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
const TOKEN_REFRESH_SKEW_MS = 60_000;

function validInteger(value: unknown, fallback: number, max: number): number {
	const result = value === undefined ? fallback : value;
	if (typeof result !== 'number' || !Number.isSafeInteger(result) || result < 1 || result > max)
		throw new GoogleAnalyticsClientError('INVALID_CONFIG', 'Invalid Google Analytics configuration');
	return result;
}

function baseUrl(value: string): string {
	const url = new URL(value);
	const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
	// Bearer tokens must not travel in clear text; plain HTTP is only allowed for loopback test servers.
	if (!(url.protocol === 'https:' || (url.protocol === 'http:' && loopback)) || url.username || url.password || url.search || url.hash) throw new Error();
	return url.toString().replace(/\/+$/u, '');
}

/** Normalize `123` or `properties/123` to the numeric GA4 property ID. */
export function normalizeGoogleAnalyticsPropertyId(value: unknown): string {
	const id = String(typeof value === 'number' || typeof value === 'string' ? value : '')
		.trim()
		.replace(/^properties\//u, '');
	if (!/^\d{1,32}$/u.test(id)) throw new GoogleAnalyticsClientError('INVALID_REQUEST', 'propertyId must be a numeric GA4 property ID');
	return id;
}

/** Service DTO -> Data API REST body: names become `{ name }` objects and propertyId moves to the path. */
const COMMON_REPORT_FIELDS = ['dimensionFilter', 'metricFilter', 'orderBys', 'limit', 'returnPropertyQuota'] as const;
const STANDARD_REPORT_FIELDS = [...COMMON_REPORT_FIELDS, 'dateRanges', 'offset', 'currencyCode', 'keepEmptyRows'] as const;

/**
 * Service DTO -> Data API REST body built from an explicit allow-list: unknown or non-applicable
 * fields (e.g. realtime `dateRanges`/`offset`) are rejected instead of forwarded.
 */
function toReportBody(input: unknown, fields: readonly string[]): Record<string, unknown> {
	if (!input || typeof input !== 'object' || Array.isArray(input)) throw new GoogleAnalyticsClientError('INVALID_REQUEST', 'Invalid Google Analytics report request');
	const record = input as Record<string, unknown>;
	const allowed = new Set(['propertyId', 'dimensions', 'metrics', ...fields]);
	for (const key of Object.keys(record))
		if (!allowed.has(key)) throw new GoogleAnalyticsClientError('INVALID_REQUEST', 'Unsupported Google Analytics report field');
	const named = (values: unknown) => {
		if (!Array.isArray(values) || !values.length || values.some((v) => typeof v !== 'string' || !v))
			throw new GoogleAnalyticsClientError('INVALID_REQUEST', 'Report dimensions and metrics must be non-empty name lists');
		return values.map((name: string) => ({ name }));
	};
	const body: Record<string, unknown> = { dimensions: named(record.dimensions), metrics: named(record.metrics) };
	for (const key of fields) if (record[key] !== undefined) body[key] = record[key];
	return body;
}

/**
 * Read-only Google Analytics Admin + Data REST client.
 *
 * Browser-safe: Web Crypto signs service-account JWTs and fetch is injectable. Each operation has
 * one deadline that covers credential resolution, token exchange and the API request.
 */
export class GoogleAnalyticsClient {
	readonly type = 'google-analytics' as const;
	readonly readOnly = true as const;
	readonly dataBaseUrl: string;
	readonly adminBaseUrl: string;
	readonly #credentials: GoogleAnalyticsCredentialSource;
	readonly #projectId?: string;
	readonly #fetch: FetchLike;
	readonly #timeoutMs: number;
	readonly #maxResponseBytes: number;
	readonly #now: () => number;
	readonly #active = new Set<{ abort(): void; done: Promise<void> }>();
	#token?: GoogleAccessToken;
	#closed = false;
	#closePromise?: Promise<void>;

	constructor(options: GoogleAnalyticsClientOptions) {
		try {
			if (!options || (typeof options.credentials !== 'function' && (typeof options.credentials !== 'object' || !options.credentials))) throw new Error();
			this.#credentials = options.credentials;
			if (options.projectId !== undefined && (typeof options.projectId !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/u.test(options.projectId))) throw new Error();
			this.#projectId = options.projectId;
			this.dataBaseUrl = baseUrl(options.dataBaseUrl ?? GoogleAnalyticsDataBaseUrl);
			this.adminBaseUrl = baseUrl(options.adminBaseUrl ?? GoogleAnalyticsAdminBaseUrl);
			this.#fetch = options.fetch ?? globalThis.fetch?.bind(globalThis);
			if (typeof this.#fetch !== 'function') throw new Error();
			this.#timeoutMs = validInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, 3_600_000);
			this.#maxResponseBytes = validInteger(options.maxResponseBytes, DEFAULT_MAX_RESPONSE_BYTES, 64 * 1024 * 1024);
			this.#now = options.now ?? Date.now;
		} catch {
			throw new GoogleAnalyticsClientError('INVALID_CONFIG', 'Invalid Google Analytics configuration');
		}
	}

	listAccountSummaries(input: GoogleAnalyticsAccountSummariesInput = {}, options?: GoogleAnalyticsRequestOptions): Promise<GoogleAnalyticsJson> {
		const query = new URLSearchParams();
		if (input.pageSize !== undefined) {
			if (!Number.isSafeInteger(input.pageSize) || input.pageSize < 1 || input.pageSize > 200)
				return Promise.reject(new GoogleAnalyticsClientError('INVALID_REQUEST', 'pageSize must be between 1 and 200'));
			query.set('pageSize', String(input.pageSize));
		}
		if (input.pageToken !== undefined) query.set('pageToken', input.pageToken);
		const suffix = query.size ? `?${query}` : '';
		return this.#request('account summaries', `${this.adminBaseUrl}/v1beta/accountSummaries${suffix}`, undefined, options);
	}

	getProperty(input: GoogleAnalyticsPropertyInput, options?: GoogleAnalyticsRequestOptions): Promise<GoogleAnalyticsJson> {
		return this.#guard(() => this.#request('property', `${this.adminBaseUrl}/v1beta/properties/${normalizeGoogleAnalyticsPropertyId(input?.propertyId)}`, undefined, options));
	}

	getMetadata(input: GoogleAnalyticsPropertyInput, options?: GoogleAnalyticsRequestOptions): Promise<GoogleAnalyticsJson> {
		return this.#guard(() => this.#request('metadata', `${this.dataBaseUrl}/v1beta/properties/${normalizeGoogleAnalyticsPropertyId(input?.propertyId)}/metadata`, undefined, options));
	}

	/** POST without side effects: Data API reports are read-only queries. */
	runReport(input: GoogleAnalyticsReportInput, options?: GoogleAnalyticsRequestOptions): Promise<GoogleAnalyticsJson> {
		return this.#guard(() => {
			const id = normalizeGoogleAnalyticsPropertyId(input?.propertyId);
			return this.#request('report', `${this.dataBaseUrl}/v1beta/properties/${id}:runReport`, toReportBody(input, STANDARD_REPORT_FIELDS), options);
		});
	}

	runRealtimeReport(input: GoogleAnalyticsRealtimeReportInput, options?: GoogleAnalyticsRequestOptions): Promise<GoogleAnalyticsJson> {
		return this.#guard(() => {
			const id = normalizeGoogleAnalyticsPropertyId(input?.propertyId);
			return this.#request('realtime report', `${this.dataBaseUrl}/v1beta/properties/${id}:runRealtimeReport`, toReportBody(input, COMMON_REPORT_FIELDS), options);
		});
	}

	async close(): Promise<void> {
		if (this.#closePromise) return this.#closePromise;
		this.#closed = true;
		this.#token = undefined;
		this.#closePromise = Promise.allSettled([...this.#active].map((entry) => (entry.abort(), entry.done))).then(() => undefined);
		return this.#closePromise;
	}

	async [Symbol.asyncDispose](): Promise<void> {
		await this.close();
	}

	async #guard<T>(run: () => Promise<T>): Promise<T> {
		return await run();
	}

	async #resolveToken(signal: AbortSignal): Promise<string> {
		if (this.#token && this.#token.expiresAt - TOKEN_REFRESH_SKEW_MS > this.#now()) return this.#token.accessToken;
		let credential: GoogleAnalyticsCredential;
		try {
			credential = typeof this.#credentials === 'function' ? await this.#credentials() : this.#credentials;
		} catch {
			throw new GoogleAnalyticsClientError('INVALID_CONFIG', 'Google Analytics credentials are unavailable');
		}
		signal.throwIfAborted();
		if (credential && 'accessToken' in credential) {
			if (typeof credential.accessToken !== 'string' || !credential.accessToken || /[\s\x00-\x1f\x7f]/u.test(credential.accessToken))
				throw new GoogleAnalyticsClientError('INVALID_CONFIG', 'Google Analytics credentials are invalid');
			return credential.accessToken;
		}
		if (!credential || !('serviceAccount' in credential))
			throw new GoogleAnalyticsClientError('INVALID_CONFIG', 'Google Analytics credentials are invalid');
		// Each call exchanges under its own deadline; a cached token is reused until near expiry.
		const token = await this.#exchange(credential.serviceAccount, signal);
		if (this.#closed) throw new GoogleAnalyticsClientError('CLOSED', 'Google Analytics client is closed');
		this.#token = token;
		return token.accessToken;
	}

	async #exchange(raw: unknown, signal: AbortSignal): Promise<GoogleAccessToken> {
		const key = parseGoogleServiceAccountKey(raw);
		const tokenUrl = key.token_uri ?? GoogleOAuthTokenUrl;
		if (tokenUrl !== GoogleOAuthTokenUrl) throw new GoogleAnalyticsClientError('INVALID_CONFIG', 'Google service account token endpoint is not allowed');
		const assertion = await createGoogleServiceAccountAssertion(key, { now: this.#now() });
		const response = await this.#fetch(tokenUrl, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString(),
			signal,
		});
		if (!response.ok) {
			void response.body?.cancel().catch(() => undefined);
			throw new GoogleAnalyticsClientError('AUTH_FAILED', 'Google service account authentication failed', response.status);
		}
		const body = await this.#readJson(response, 'token');
		const accessToken = body.access_token;
		const expiresIn = typeof body.expires_in === 'number' && body.expires_in > 0 ? body.expires_in : 3600;
		if (typeof accessToken !== 'string' || !accessToken || /[\s\x00-\x1f\x7f]/u.test(accessToken))
			throw new GoogleAnalyticsClientError('AUTH_FAILED', 'Google service account authentication failed');
		return { accessToken, expiresAt: this.#now() + expiresIn * 1000 };
	}

	async #readJson(response: Response, operation: string): Promise<GoogleAnalyticsJson> {
		const contentLength = response.headers.get('content-length');
		if (contentLength !== null && /^\d+$/u.test(contentLength) && Number(contentLength) > this.#maxResponseBytes) {
			void response.body?.cancel().catch(() => undefined);
			throw new GoogleAnalyticsClientError('RESPONSE_TOO_LARGE', 'Google Analytics response is too large');
		}
		const chunks: Uint8Array[] = [];
		let size = 0;
		const reader = response.body?.getReader();
		if (reader) {
			try {
				for (;;) {
					const chunk = await reader.read();
					if (chunk.done) break;
					size += chunk.value.byteLength;
					if (size > this.#maxResponseBytes) {
						void reader.cancel().catch(() => undefined);
						throw new GoogleAnalyticsClientError('RESPONSE_TOO_LARGE', 'Google Analytics response is too large');
					}
					chunks.push(chunk.value);
				}
			} finally {
				reader.releaseLock();
			}
		}
		const bytes = new Uint8Array(size);
		let offset = 0;
		for (const chunk of chunks) {
			bytes.set(chunk, offset);
			offset += chunk.byteLength;
		}
		let value: unknown;
		try {
			const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
			value = text.trim() ? JSON.parse(text) : {};
		} catch {
			throw new GoogleAnalyticsClientError('INVALID_RESPONSE', `Google Analytics ${operation} returned invalid JSON`);
		}
		if (!value || typeof value !== 'object' || Array.isArray(value))
			throw new GoogleAnalyticsClientError('INVALID_RESPONSE', `Google Analytics ${operation} returned an unexpected response`);
		return value as GoogleAnalyticsJson;
	}

	async #request(operation: string, url: string, body: unknown, options: GoogleAnalyticsRequestOptions | undefined): Promise<GoogleAnalyticsJson> {
		if (this.#closed) throw new GoogleAnalyticsClientError('CLOSED', 'Google Analytics client is closed');
		if (options?.signal?.aborted) throw new GoogleAnalyticsClientError('ABORTED', 'Google Analytics request was aborted');
		const timeoutMs = Math.min(this.#timeoutMs, validTimeout(options?.timeoutMs, this.#timeoutMs));
		const controller = new AbortController();
		let rejectStop!: (reason: GoogleAnalyticsClientError) => void;
		const stopped = new Promise<never>((_, reject) => {
			rejectStop = reject;
		});
		void stopped.catch(() => undefined);
		const stop = (code: 'ABORTED' | 'TIMEOUT' | 'CLOSED') => {
			if (controller.signal.aborted) return;
			const error = new GoogleAnalyticsClientError(
				code,
				code === 'TIMEOUT' ? 'Google Analytics request timed out' : code === 'CLOSED' ? 'Google Analytics client is closed' : 'Google Analytics request was aborted',
			);
			controller.abort(error);
			rejectStop(error);
		};
		let finish!: () => void;
		const active = { abort: () => stop('CLOSED'), done: new Promise<void>((resolve) => (finish = resolve)) };
		this.#active.add(active);
		const callerAbort = () => stop('ABORTED');
		options?.signal?.addEventListener('abort', callerAbort, { once: true });
		const timer = setTimeout(() => stop('TIMEOUT'), timeoutMs);
		try {
			return await Promise.race([
				(async () => {
					const token = await this.#resolveToken(controller.signal);
					controller.signal.throwIfAborted();
					const headers = new Headers({ authorization: `Bearer ${token}`, accept: 'application/json' });
					if (body !== undefined) headers.set('content-type', 'application/json');
					if (this.#projectId) headers.set('x-goog-user-project', this.#projectId);
					const response = await this.#fetch(url, {
						method: body === undefined ? 'GET' : 'POST',
						headers,
						body: body === undefined ? undefined : JSON.stringify(body),
						signal: controller.signal,
					});
					if (!response.ok) {
						// Upstream error bodies may echo request details; do not buffer or surface them.
						void response.body?.cancel().catch(() => undefined);
						if (response.status === 401) this.#token = undefined;
						throw new GoogleAnalyticsClientError(
							response.status === 401 || response.status === 403 ? 'AUTH_FAILED' : 'REQUEST_FAILED',
							`Google Analytics ${operation} request failed (HTTP ${response.status})`,
							response.status,
						);
					}
					return await this.#readJson(response, operation);
				})(),
				stopped,
			]);
		} catch (error) {
			if (controller.signal.reason instanceof GoogleAnalyticsClientError) throw controller.signal.reason;
			if (error instanceof GoogleAnalyticsClientError) throw error;
			throw new GoogleAnalyticsClientError('REQUEST_FAILED', `Google Analytics ${operation} request failed`);
		} finally {
			clearTimeout(timer);
			options?.signal?.removeEventListener('abort', callerAbort);
			this.#active.delete(active);
			finish();
		}
	}
}

function validTimeout(value: unknown, fallback: number): number {
	if (value === undefined) return fallback;
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > 3_600_000)
		throw new GoogleAnalyticsClientError('INVALID_REQUEST', 'Invalid Google Analytics timeout');
	return value;
}
