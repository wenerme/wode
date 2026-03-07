import consola from 'consola';
import { buildGrafanaHeaders, type ResolvedGrafanaAuthOptions } from './auth';

const log = consola.withTag('grafana-client');

export type GrafanaHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type GrafanaRequestOptions = {
	path: string;
	method?: GrafanaHttpMethod;
	params?: Record<string, unknown>;
	body?: unknown;
	headers?: HeadersInit;
	responseType?: 'json' | 'text' | 'arrayBuffer';
	expectedStatuses?: number[];
};

export type DatasourceSummary = {
	id?: number;
	uid?: string;
	name?: string;
	type?: string;
	isDefault?: boolean;
	jsonData?: Record<string, unknown>;
	secureJsonFields?: Record<string, boolean>;
	[key: string]: unknown;
};

function appendQueryParams(url: URL, params?: Record<string, unknown>) {
	if (!params) return;
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === '') continue;
		if (Array.isArray(value)) {
			for (const item of value) {
				if (item === undefined || item === null || item === '') continue;
				url.searchParams.append(key, String(item));
			}
			continue;
		}
		url.searchParams.append(key, String(value));
	}
}

type CachedValue<T> = {
	expiresAt: number;
	value: T;
};

export class GrafanaApiClient {
	readonly options: ResolvedGrafanaAuthOptions;
	#datasources?: CachedValue<DatasourceSummary[]>;
	#publicUrl?: CachedValue<string>;

	constructor(options: ResolvedGrafanaAuthOptions) {
		this.options = options;
	}

	get baseUrl() {
		return this.options.url;
	}

	async request<T = unknown>(options: GrafanaRequestOptions): Promise<T> {
		const { data } = await this.fetch(options);
		return data as T;
	}

	async requestText(options: GrafanaRequestOptions) {
		return this.request<string>({ ...options, responseType: 'text' });
	}

	async requestArrayBuffer(options: GrafanaRequestOptions) {
		return this.request<ArrayBuffer>({ ...options, responseType: 'arrayBuffer' });
	}

	async fetch({
		path,
		method = 'GET',
		params,
		body,
		headers,
		responseType = 'json',
		expectedStatuses = [200],
	}: GrafanaRequestOptions) {
		const requestUrl = new URL(path.startsWith('http') ? path : `${this.baseUrl}${path}`);
		appendQueryParams(requestUrl, params);

		const hasBody = body !== undefined;
		const requestHeaders = buildGrafanaHeaders(this.options, headers, hasBody ? 'application/json' : undefined);
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);
		const startedAt = Date.now();

		try {
			if (this.options.debug) {
				log.debug(`${method} ${requestUrl.toString()}`);
			}

			const response = await fetch(requestUrl, {
				method,
				headers: requestHeaders,
				body: hasBody ? JSON.stringify(body) : undefined,
				signal: controller.signal,
			});

			const data =
				responseType === 'arrayBuffer'
					? await response.arrayBuffer()
					: responseType === 'text'
						? await response.text()
						: await this.parseResponse(response);

			if (this.options.debug) {
				log.debug(`${method} ${requestUrl.pathname} ${response.status} ${Date.now() - startedAt}ms`);
			}

			if (!expectedStatuses.includes(response.status)) {
				const message = typeof data === 'string' ? data : JSON.stringify(data);
				throw new Error(`Grafana API error ${response.status}: ${message}`);
			}

			return { response, data };
		} finally {
			clearTimeout(timer);
		}
	}

	private async parseResponse(response: Response) {
		const contentType = response.headers.get('content-type') || '';
		if (contentType.includes('application/json')) {
			return response.json();
		}
		return response.text();
	}

	async listDatasources(force = false) {
		const now = Date.now();
		if (!force && this.#datasources && this.#datasources.expiresAt > now) {
			return this.#datasources.value;
		}
		const value = await this.request<DatasourceSummary[]>({
			path: '/api/datasources',
		});
		this.#datasources = {
			value,
			expiresAt: now + 10_000,
		};
		return value;
	}

	async getDatasource(uid: string) {
		return this.request<DatasourceSummary>({
			path: `/api/datasources/uid/${encodeURIComponent(uid)}`,
		});
	}

	async findDatasourcesByType(type: string) {
		const all = await this.listDatasources();
		return all.filter((entry) => entry.type?.toLowerCase() === type.toLowerCase());
	}

	datasourceProxyPath(uid: string, path = '') {
		return `/api/datasources/proxy/uid/${encodeURIComponent(uid)}${path.startsWith('/') ? path : `/${path}`}`;
	}

	datasourceResourcePath(uid: string, path = '') {
		return `/api/datasources/resource/uid/${encodeURIComponent(uid)}${path.startsWith('/') ? path : `/${path}`}`;
	}

	async datasourceProxyRequest<T = unknown>(uid: string, path: string, options: Omit<GrafanaRequestOptions, 'path'> = {}) {
		return this.request<T>({
			...options,
			path: this.datasourceProxyPath(uid, path),
		});
	}

	async datasourceResourceRequest<T = unknown>(
		uid: string,
		path: string,
		options: Omit<GrafanaRequestOptions, 'path'> = {},
	) {
		return this.request<T>({
			...options,
			path: this.datasourceResourcePath(uid, path),
		});
	}

	async queryDatasource(body: Record<string, unknown>) {
		return this.request({
			path: '/api/ds/query',
			method: 'POST',
			body,
		});
	}

	async getPublicUrl(force = false) {
		const now = Date.now();
		if (!force && this.#publicUrl && this.#publicUrl.expiresAt > now) {
			return this.#publicUrl.value;
		}

		try {
			const settings = await this.request<{ appUrl?: string; appSubUrl?: string }>({
				path: '/api/frontend/settings',
			});
			const value = settings.appUrl || `${this.baseUrl}${settings.appSubUrl ?? ''}` || this.baseUrl;
			this.#publicUrl = { value, expiresAt: now + 60_000 };
			return value;
		} catch {
			return this.baseUrl;
		}
	}
}
