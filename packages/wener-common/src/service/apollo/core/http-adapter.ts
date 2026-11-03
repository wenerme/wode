import type { ApolloAdminEndpoint, ApolloConnectionConfig, ApolloHttpAuth, ApolloPortalEndpoint } from './config';
import { encodeApolloUtf8Base64 } from './encoding';
import { ApolloServiceError, ApolloServiceErrorCodes } from './errors';
import { createApolloHttpError } from './http-error';
import type { ApolloAdapter, ApolloConfigReadRequest, ApolloHttpRequest, ApolloReadFormat } from './interface';

export type ApolloFetch = typeof fetch;

export interface CreateApolloHttpAdapterOptions {
	fetch?: ApolloFetch;
}

function timeoutSignal(timeout: number | undefined): AbortSignal | undefined {
	return timeout ? AbortSignal.timeout(timeout) : undefined;
}

function joinUrl(baseUrl: string, apiPath: string): URL {
	const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
	return new URL(`${baseUrl}${path}`);
}

function applyQuery(url: URL, query: Record<string, unknown> | undefined): void {
	for (const [key, value] of Object.entries(query ?? {})) {
		if (value === undefined || value === null || value === '') continue;
		url.searchParams.set(key, String(value));
	}
}

function authHeaders(headers: Record<string, string>, auth: ApolloHttpAuth | undefined): Record<string, string> {
	const out = { ...headers };
	if (!auth) return out;
	if (auth.type === 'token') out.Authorization = auth.token;
	else out.Authorization = `Basic ${encodeApolloUtf8Base64(`${auth.username}:${auth.password}`)}`;
	return out;
}

function splitSetCookieHeader(value: string): string[] {
	return value
		.split(/,(?=\s*[^;,=\s]+=)/u)
		.map((item) => item.trim())
		.filter(Boolean);
}

function getSetCookies(headers: Headers): string[] {
	const withGetter = headers as Headers & { getSetCookie?: () => string[] };
	if (typeof withGetter.getSetCookie === 'function') return withGetter.getSetCookie();
	const combined = headers.get('set-cookie');
	return combined ? splitSetCookieHeader(combined) : [];
}

function cookieHeaderFromSetCookies(values: string[]): string {
	const cookies = new Map<string, string>();
	for (const value of values) {
		const first = value.split(';', 1)[0]?.trim();
		if (!first) continue;
		const index = first.indexOf('=');
		if (index <= 0) continue;
		cookies.set(first.slice(0, index), first.slice(index + 1));
	}
	return Array.from(cookies.entries())
		.map(([key, value]) => `${key}=${value}`)
		.join('; ');
}

async function portalLoginCookieHeader(
	endpoint: ApolloPortalEndpoint,
	request: ApolloFetch,
): Promise<string | undefined> {
	if (endpoint.auth?.type !== 'basic') return undefined;
	const url = joinUrl(endpoint.baseUrl, '/signin');
	const body = new URLSearchParams({ username: endpoint.auth.username, password: endpoint.auth.password });
	const response = await request(url, {
		method: 'POST',
		headers: new Headers({
			Accept: 'application/json,text/html',
			'Content-Type': 'application/x-www-form-urlencoded',
			...endpoint.headers,
		}),
		body,
		redirect: 'manual',
		signal: timeoutSignal(endpoint.requestTimeoutMs),
	});
	return cookieHeaderFromSetCookies(getSetCookies(response.headers)) || undefined;
}

async function parseResponse<T>(response: Response, method: string, url: URL): Promise<T> {
	if (!response.ok) throw await createApolloHttpError(response, method, url);
	const text = await response.text();
	if (!text) return undefined as T;
	const contentType = response.headers.get('content-type') ?? '';
	if (contentType.includes('json') || /^[[{]/u.test(text.trim())) return JSON.parse(text) as T;
	return text as T;
}

async function requestAdmin<T>(
	endpoint: ApolloAdminEndpoint,
	input: ApolloHttpRequest,
	request: ApolloFetch,
): Promise<T> {
	const url = joinUrl(endpoint.baseUrl, input.path);
	applyQuery(url, input.query);
	const headers = new Headers({
		Accept: 'application/json',
		...authHeaders(endpoint.headers, endpoint.auth),
		...input.headers,
	});
	let body: BodyInit | undefined;
	if (input.body !== undefined) {
		headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json;charset=UTF-8');
		body = typeof input.body === 'string' ? input.body : JSON.stringify(input.body);
	}
	const method = (input.method ?? (body ? 'POST' : 'GET')).toUpperCase();
	return parseResponse<T>(
		await request(url, { method, headers, body, redirect: 'manual', signal: timeoutSignal(endpoint.requestTimeoutMs) }),
		method,
		url,
	);
}

async function requestPortal<T>(
	endpoint: ApolloPortalEndpoint,
	input: ApolloHttpRequest,
	request: ApolloFetch,
): Promise<T> {
	const url = joinUrl(endpoint.baseUrl, input.path);
	applyQuery(url, input.query);
	const method = (input.method ?? 'GET').toUpperCase();
	const headers = new Headers({
		Accept: 'application/json',
		...authHeaders(endpoint.headers, endpoint.auth),
		...input.headers,
	});
	let body: BodyInit | undefined;
	if (input.body !== undefined) {
		headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json;charset=UTF-8');
		body = typeof input.body === 'string' ? input.body : JSON.stringify(input.body);
	}
	let response = await request(url, {
		method,
		headers,
		body,
		redirect: 'manual',
		signal: timeoutSignal(endpoint.requestTimeoutMs),
	});
	const location = response.headers.get('location') ?? '';
	// Sign-in establishes the session for reads and writes; read-only admission applies to business requests.
	if (response.status >= 300 && response.status < 400 && /signin|login/u.test(location)) {
		const cookie = await portalLoginCookieHeader(endpoint, request);
		if (cookie) {
			response = await request(url, {
				method,
				headers: new Headers({
					Accept: 'application/json',
					...endpoint.headers,
					...input.headers,
					Cookie: cookie,
					...(body ? { 'Content-Type': headers.get('Content-Type') ?? 'application/json;charset=UTF-8' } : {}),
				}),
				body,
				redirect: 'manual',
				signal: timeoutSignal(endpoint.requestTimeoutMs),
			});
		}
	}
	return parseResponse<T>(response, method, url);
}

function propertiesText(data: Record<string, unknown>): string {
	return Object.entries(data)
		.map(([key, value]) => `${key}=${value == null ? '' : String(value)}`)
		.join('\n');
}

async function readConfig<T>(
	config: ApolloConnectionConfig,
	input: ApolloConfigReadRequest,
	request: ApolloFetch,
): Promise<T> {
	const namespace = input.namespace ?? config.namespace;
	const format: ApolloReadFormat = input.format ?? 'auto';
	const { ApolloConfigClient } = await import('@wener/client/apolloconfig');
	const endpoint = config.config;
	const wrappedFetch: ApolloFetch = async (fetchInput, init) => {
		const headers = new Headers(init?.headers);
		for (const [key, value] of Object.entries(endpoint.headers)) if (!headers.has(key)) headers.set(key, value);
		const response = await request(fetchInput, {
			...init,
			headers,
			redirect: 'manual',
			signal: init?.signal ?? timeoutSignal(endpoint.requestTimeoutMs),
		});
		if ((response.headers.get('content-type') ?? '').toLowerCase().includes('text/html')) {
			throw new Error('Apollo ConfigService returned HTML');
		}
		return response;
	};
	const appId = config.appId;
	if (!appId) throw new Error('Apollo appId is required');
	const client = new ApolloConfigClient({
		url: endpoint.baseUrl,
		appId,
		cluster: config.cluster,
		namespace,
		appSecret: endpoint.auth?.appSecret,
		fetch: wrappedFetch,
	});
	if (format === 'auto') {
		const suffix = namespace.split('.').pop()?.toLowerCase();
		if (suffix && ['yaml', 'yml', 'json', 'xml', 'txt'].includes(suffix))
			return (await client.getContent({ namespace })) as T;
		return (await client.getJson({ namespace })) as T;
	}
	if (format === 'config') return (await client.getConfig({ namespace })) as T;
	if (format === 'json') return (await client.getJson({ namespace })) as T;
	if (format === 'properties') return propertiesText(await client.getJson({ namespace })) as T;
	if (format === 'raw') return (await client.getConfigRaw({ namespace })) as T;
	if (format === 'content') return (await client.getContent({ namespace })) as T;
	return (await client.getData({ namespace })) as T;
}

export function createApolloHttpAdapter(
	config: ApolloConnectionConfig,
	options: CreateApolloHttpAdapterOptions = {},
): ApolloAdapter {
	const request = options.fetch ?? globalThis.fetch;
	return {
		request<T>(input: ApolloHttpRequest): Promise<T> {
			const method = (input.method ?? (input.body === undefined ? 'GET' : 'POST')).toUpperCase();
			if (config.readOnly !== false && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
				return Promise.reject(
					new ApolloServiceError(ApolloServiceErrorCodes.InvalidRequest, 'Apollo service is read-only'),
				);
			}
			return input.role === 'admin'
				? requestAdmin<T>(config.admin, { ...input, method }, request)
				: requestPortal<T>(config.portal, { ...input, method }, request);
		},
		readConfig<T>(input: ApolloConfigReadRequest = {}): Promise<T> {
			return readConfig<T>(config, input, request);
		},
		async close() {},
	};
}
