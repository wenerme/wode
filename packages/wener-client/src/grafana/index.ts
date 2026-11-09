import type { FetchLike } from '@wener/utils';
import { GrafanaClientError } from './errors';
import { validateRequestInput, type GrafanaRequestInput, type GrafanaRequestOptions } from './operations';

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
export interface GrafanaListDashboardInput {
	query?: string;
	tag?: string[];
	folderUid?: string;
	limit?: number;
}
export interface GrafanaGetDashboardInput {
	uid: string;
}
export interface GrafanaUpdateDashboardInput {
	dashboard: unknown;
	folderUid?: string;
	message?: string;
	overwrite?: boolean;
	/** Preview the save without issuing the `POST /api/dashboards/db` request. */
	dryRun?: boolean;
}
export interface GrafanaGetPanelInput {
	dashboardUid: string;
	panelId: number;
}
export interface GrafanaPatchPanelInput {
	dashboardUid: string;
	panelId: number;
	set?: Record<string, unknown>;
	merge?: Record<string, unknown>;
	replace?: unknown;
	message?: string;
	/** When true, still reads the dashboard and computes the patch, but never calls `updateDashboard`. */
	dryRun?: boolean;
}
/** Minimal, vendor-neutral facts about the dashboard a panel patch touched; never the full dashboard JSON. */
export interface GrafanaDashboardSummary {
	uid?: string;
	version?: number;
	url?: string;
}
/**
 * Agent-friendly `patchPanel` result. `changed` is false when the computed panel is structurally
 * identical to the one already on the dashboard (no `POST /api/dashboards/db` is issued in that
 * case). When a save does happen, the raw Grafana save response's own top-level fields (such as
 * `id`/`status`/`version`) are preserved alongside `changed`/`panel`/`dashboard` so existing
 * callers reading those fields keep working.
 */
export interface GrafanaPatchPanelResult {
	changed: boolean;
	panel: unknown;
	dashboard: GrafanaDashboardSummary;
	dryRun?: boolean;
	[key: string]: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** JSON-safe deep clone; Grafana payloads only ever contain JSON-representable values. */
function deepClone<T>(value: T): T {
	if (Array.isArray(value)) return value.map((entry) => deepClone(entry)) as unknown as T;
	if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, deepClone(entry)])) as unknown as T;
	return value;
}

const FORBIDDEN_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

/** Rejects path/merge keys that could reach or rewrite a shared prototype. */
function assertSafePathSegment(segment: string | number): void {
	if (typeof segment === 'string' && FORBIDDEN_PATH_SEGMENTS.has(segment))
		throw new GrafanaClientError('INVALID_REQUEST', 'Grafana panel path cannot reference __proto__, constructor or prototype');
}

/** Splits a dot/bracket path like `fieldConfig.defaults[0].unit` into string/number segments. */
function splitPath(path: string): (string | number)[] {
	const segments: (string | number)[] = [];
	let current = '';
	for (let index = 0; index < path.length; index++) {
		const char = path[index]!;
		if (char === '.') {
			if (current) segments.push(current);
			current = '';
		} else if (char === '[') {
			if (current) segments.push(current);
			current = '';
			const close = path.indexOf(']', index);
			if (close < 0) throw new GrafanaClientError('INVALID_REQUEST', 'Invalid Grafana panel set path');
			const token = path.slice(index + 1, close);
			segments.push(/^\d+$/u.test(token) ? Number(token) : token);
			index = close;
		} else {
			current += char;
		}
	}
	if (current) segments.push(current);
	if (segments.length === 0) throw new GrafanaClientError('INVALID_REQUEST', 'Invalid Grafana panel set path');
	for (const segment of segments) assertSafePathSegment(segment);
	return segments;
}

/** Assigns a value at a dot/bracket path, creating intermediate objects/arrays as needed. */
function setPathValue(target: Record<string, unknown>, path: string, value: unknown): void {
	const segments = splitPath(path);
	let cursor: Record<string | number, unknown> = target;
	for (let index = 0; index < segments.length - 1; index++) {
		const segment = segments[index]!;
		const next = cursor[segment];
		if (!isPlainObject(next) && !Array.isArray(next)) {
			cursor[segment] = typeof segments[index + 1] === 'number' ? [] : {};
		}
		cursor = cursor[segment] as Record<string | number, unknown>;
	}
	cursor[segments[segments.length - 1]!] = value;
}

/** Deep merges `patch` into `base`; plain objects merge recursively, everything else (including arrays) is replaced wholesale. */
function deepMerge(base: unknown, patch: unknown): unknown {
	if (!isPlainObject(base) || !isPlainObject(patch)) return patch;
	const result: Record<string, unknown> = { ...base };
	for (const [key, value] of Object.entries(patch)) {
		assertSafePathSegment(key);
		result[key] = isPlainObject(result[key]) && isPlainObject(value) ? deepMerge(result[key], value) : value;
	}
	return result;
}

/** Structural equality over JSON-shaped values: object key order is irrelevant, array order matters. */
function deepEqualJson(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (Array.isArray(a) || Array.isArray(b)) {
		if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
		for (let index = 0; index < a.length; index++) if (!deepEqualJson(a[index], b[index])) return false;
		return true;
	}
	if (isPlainObject(a) || isPlainObject(b)) {
		if (!isPlainObject(a) || !isPlainObject(b)) return false;
		const aKeys = Object.keys(a);
		if (aKeys.length !== Object.keys(b).length) return false;
		for (const key of aKeys) {
			if (!Object.hasOwn(b, key) || !deepEqualJson(a[key], b[key])) return false;
		}
		return true;
	}
	return false;
}

/** Extracts a small, safe summary (uid/version/url) from a dashboard and/or its save response; never the full dashboard. */
function summarizeGrafanaDashboard(dashboard: Record<string, unknown>, saveResult?: unknown): GrafanaDashboardSummary {
	const save = isPlainObject(saveResult) ? saveResult : undefined;
	const summary: GrafanaDashboardSummary = {};
	const uid = save?.uid ?? dashboard.uid;
	if (typeof uid === 'string') summary.uid = uid;
	const version = save?.version ?? dashboard.version;
	if (typeof version === 'number') summary.version = version;
	const url = save?.url ?? dashboard.url;
	if (typeof url === 'string') summary.url = url;
	return summary;
}

/**
 * Rebuilds a (possibly nested) `panels` array so the entry identified by `targetParent[targetIndex]`
 * becomes `replacement`, copying every array on the path from `panels` down to that entry and
 * leaving every sibling subtree referentially untouched.
 */
function replacePanelInTree(panels: unknown[], targetParent: unknown[], targetIndex: number, replacement: unknown): unknown[] {
	if (panels === targetParent) {
		const next = [...panels];
		next[targetIndex] = replacement;
		return next;
	}
	return panels.map((entry) => {
		if (!isPlainObject(entry) || !Array.isArray(entry.panels)) return entry;
		const nestedPanels = replacePanelInTree(entry.panels, targetParent, targetIndex, replacement);
		return nestedPanels === entry.panels ? entry : { ...entry, panels: nestedPanels };
	});
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
			if (!response.ok) throw new GrafanaClientError(
				response.status === 401 || response.status === 403 ? 'AUTH_FAILED'
					: response.status === 409 || response.status === 412 ? 'CONFLICT'
						: 'REQUEST_FAILED',
				`Grafana ${operation} request failed`, response.status,
			);
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
	async listDashboard(input: GrafanaListDashboardInput = {}, options?: GrafanaRequestOptions): Promise<unknown> {
		const params: Record<string, string | string[] | undefined> = { type: 'dash-db' };
		if (input.query !== undefined) params.query = input.query;
		if (input.tag !== undefined) params.tag = input.tag;
		if (input.folderUid !== undefined) params.folderUIDs = input.folderUid;
		if (input.limit !== undefined) params.limit = String(input.limit);
		return (await this.#request('listDashboard', 'GET', '/api/search', params, undefined, options)).data;
	}
	async getDashboard(input: GrafanaGetDashboardInput, options?: GrafanaRequestOptions): Promise<unknown> {
		if (typeof input?.uid !== 'string' || !input.uid.trim()) throw new GrafanaClientError('INVALID_REQUEST', 'Invalid Grafana dashboard uid');
		return (await this.#request('getDashboard', 'GET', `/api/dashboards/uid/${encodeURIComponent(input.uid)}`, {}, undefined, options)).data;
	}
	async updateDashboard(input: GrafanaUpdateDashboardInput, options?: GrafanaRequestOptions): Promise<unknown> {
		if (!isPlainObject(input?.dashboard)) throw new GrafanaClientError('INVALID_REQUEST', 'Invalid Grafana dashboard body');
		const folderUid = input.folderUid;
		const message = input.message;
		const overwrite = input.overwrite ?? false;
		if (input.dryRun === true) {
			return {
				dryRun: true,
				changed: true,
				dashboard: input.dashboard,
				folderUid,
				message,
				overwrite,
			};
		}
		const body = {
			dashboard: input.dashboard,
			folderUid,
			message,
			overwrite,
		};
		return (await this.#request('updateDashboard', 'POST', '/api/dashboards/db', {}, body, options)).data;
	}
	async #findPanel(dashboardUid: string, panelId: number, options?: GrafanaRequestOptions): Promise<{ dashboard: Record<string, unknown>; panel: Record<string, unknown>; parent: unknown[]; index: number; folderUid?: string }> {
		const result = await this.getDashboard({ uid: dashboardUid }, options);
		if (!isPlainObject(result) || !isPlainObject(result.dashboard)) throw new GrafanaClientError('INVALID_RESPONSE', 'Grafana returned an invalid dashboard');
		const dashboard = result.dashboard;
		if (!Array.isArray(dashboard.panels)) throw new GrafanaClientError('INVALID_RESPONSE', 'Grafana dashboard has no panels array');
		const matches: { panel: Record<string, unknown>; parent: unknown[]; index: number }[] = [];
		// Classic dashboards can nest panels inside a collapsed row's own `panels` array.
		const visit = (panels: unknown[]): void => {
			for (let index = 0; index < panels.length; index++) {
				const entry = panels[index];
				if (!isPlainObject(entry)) continue;
				if (entry.id === panelId) matches.push({ panel: entry, parent: panels, index });
				if (Array.isArray(entry.panels)) visit(entry.panels);
			}
		};
		visit(dashboard.panels);
		if (matches.length === 0) throw new GrafanaClientError('NOT_FOUND', `Grafana panel not found: dashboardUid=${dashboardUid} panelId=${panelId}`);
		if (matches.length > 1) throw new GrafanaClientError('AMBIGUOUS', `Grafana panel id is ambiguous: dashboardUid=${dashboardUid} panelId=${panelId}`);
		const meta = isPlainObject(result.meta) ? result.meta : undefined;
		const folderUid = typeof meta?.folderUid === 'string' ? meta.folderUid : undefined;
		const match = matches[0]!;
		return { dashboard, panel: match.panel, parent: match.parent, index: match.index, folderUid };
	}
	async getPanel(input: GrafanaGetPanelInput, options?: GrafanaRequestOptions): Promise<unknown> {
		if (typeof input?.dashboardUid !== 'string' || !input.dashboardUid.trim() || typeof input.panelId !== 'number')
			throw new GrafanaClientError('INVALID_REQUEST', 'Invalid Grafana panel reference');
		return (await this.#findPanel(input.dashboardUid, input.panelId, options)).panel;
	}
	async patchPanel(input: GrafanaPatchPanelInput, options?: GrafanaRequestOptions): Promise<GrafanaPatchPanelResult> {
		if (typeof input?.dashboardUid !== 'string' || !input.dashboardUid.trim() || typeof input.panelId !== 'number')
			throw new GrafanaClientError('INVALID_REQUEST', 'Invalid Grafana panel reference');
		const modeCount = Number(input.set !== undefined) + Number(input.merge !== undefined) + Number(input.replace !== undefined);
		if (modeCount !== 1) throw new GrafanaClientError('INVALID_REQUEST', 'Grafana panel patch requires exactly one of set, merge or replace');
		const { dashboard, panel, parent, index, folderUid } = await this.#findPanel(input.dashboardUid, input.panelId, options);
		let updated: Record<string, unknown>;
		if (input.set !== undefined) {
			if (!isPlainObject(input.set)) throw new GrafanaClientError('INVALID_REQUEST', 'Grafana panel set must be a path/value object');
			// Deep clone before mutating -- `panel` may share nested objects/arrays with the dashboard
			// we just read, and setPathValue otherwise mutates them in place, corrupting the no-op check below.
			updated = deepClone(panel);
			for (const [path, value] of Object.entries(input.set)) setPathValue(updated, path, value);
		} else if (input.merge !== undefined) {
			if (!isPlainObject(input.merge)) throw new GrafanaClientError('INVALID_REQUEST', 'Grafana panel merge must be an object');
			updated = deepMerge(panel, input.merge) as Record<string, unknown>;
		} else {
			if (!isPlainObject(input.replace)) throw new GrafanaClientError('INVALID_REQUEST', 'Grafana panel replace must be an object');
			updated = input.replace;
		}
		if (updated.id !== input.panelId) throw new GrafanaClientError('INVALID_REQUEST', 'Grafana panel patch must keep the original panel id');
		if (deepEqualJson(updated, panel)) {
			return {
				changed: false,
				panel,
				dashboard: summarizeGrafanaDashboard(dashboard),
				...(input.dryRun === true ? { dryRun: true } : {}),
			};
		}
		// Rebuild only the path from the dashboard root down to the matched panel's parent array;
		// everything else in the tree (rows, other panels) is left untouched.
		const nextPanels = replacePanelInTree(dashboard.panels as unknown[], parent, index, updated);
		const nextDashboard = { ...dashboard, panels: nextPanels };
		if (input.dryRun === true) {
			return {
				changed: true,
				panel: updated,
				dashboard: summarizeGrafanaDashboard(nextDashboard),
				dryRun: true,
			};
		}
		const saveResult = await this.updateDashboard({ dashboard: nextDashboard, folderUid, message: input.message }, options);
		return {
			...(isPlainObject(saveResult) ? saveResult : {}),
			changed: true,
			panel: updated,
			dashboard: summarizeGrafanaDashboard(nextDashboard, saveResult),
		};
	}
	async close(): Promise<void> {
		if (this.#closePromise) return this.#closePromise;
		this.#closed = true;
		this.#closePromise = Promise.allSettled([...this.#active].map((entry) => { entry.abort(); return entry.done; })).then(() => undefined);
		return this.#closePromise;
	}
}

export { isGrafanaWriteMethod as isGrafanaApiWrite };
