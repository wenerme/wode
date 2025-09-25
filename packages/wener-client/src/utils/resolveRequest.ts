import { isPlainObject } from '@wener/utils';

export interface ResolveRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
	url: string;
	baseUrl?: string;
	params?: Record<string, any>;
	body?: any;
	headers?: Record<string, string>;
}

export interface ResolvedRequest {
	url: URL;
	init: RequestInit;
	headers: Headers;
}

/**
 * Resolves request options into a URL and RequestInit object
 * Common logic extracted from various client request implementations
 */
export function resolveRequest(options: ResolveRequestOptions): ResolvedRequest {
	const { url, baseUrl = '', params = {}, body, method = 'GET', ..._init } = options;

	// Build URL
	let fullUrl: string;
	if (baseUrl && !/^https?:\/\//.test(url)) {
		// Handle relative URLs
		const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
		const normalizedPath = url.startsWith('/') ? url.slice(1) : url;
		fullUrl = normalizedBase + normalizedPath;
	} else {
		fullUrl = url;
	}

	const u = new URL(fullUrl);

	// Add query parameters
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value === null || value === undefined) continue;

			if (Array.isArray(value)) {
				// Handle array values - append multiple params with same key
				for (const item of value) {
					u.searchParams.append(key, String(item));
				}
			} else {
				u.searchParams.set(key, String(value));
			}
		}
		// Sort for consistent ordering (useful for signatures)
		u.searchParams.sort();
	}

	// Normalize headers to Headers object
	const headers = new Headers(_init.headers);

	// Build RequestInit by spreading the remaining options
	const init: RequestInit = {
		..._init,
		method,
		headers,
	};

	let ct: string | undefined;
	if (body !== undefined && body !== null) {
		if (isPlainObject(body) || Array.isArray(body)) {
			init.body = JSON.stringify(body);
			ct = 'application/json; charset=utf-8';
		} else if (body instanceof FormData) {
			init.body = body;
			// Don't set Content-Type for FormData - browser will add boundary
		} else if (body instanceof URLSearchParams) {
			init.body = body;
			ct = 'application/x-www-form-urlencoded';
		} else if (body instanceof Blob) {
			init.body = body;
			ct = body.type;
		} else {
			init.body = body;
		}
	}
	if (ct && !headers.has('Content-Type')) {
		headers.set('Content-Type', ct);
	}

	return { url: u, init, headers };
}
