import { type FetchLike } from '@wener/utils';

export type RequestOptions = {
	url: string;
	baseUrl?: string;
	params?: Record<string, any>;
	data?: any;
	headers?: Record<string, string>;
	method?: string;
	fetch?: FetchLike;
	signal?: AbortSignal;
};

export async function request<O = any>(options: RequestOptions): Promise<O> {
	let {
		url,
		baseUrl = '',
		params = {},
		data,
		headers = {},
		method = 'GET',
		fetch = globalThis.fetch,
		signal,
	} = options;

	let u: URL;
	if (baseUrl && !/^https?:\/\//.test(url)) {
		if (!baseUrl.endsWith('/')) {
			baseUrl += '/';
		}
		if (url.startsWith('/')) {
			url = url.slice(1);
		}
		u = new URL(baseUrl + url);
	} else {
		u = new URL(url);
	}

	if (params) {
		for (const [k, v] of Object.entries(params)) {
			if (v === null || v === undefined) continue;
			if (Array.isArray(v)) {
				for (const vv of v) {
					u.searchParams.append(k, String(vv));
				}
				continue;
			}
			u.searchParams.set(k, String(v));
		}
	}
	u.searchParams.sort();

	const req: RequestInit = {
		method,
		signal,
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
	};

	if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
		req.body = JSON.stringify(data);
	}

	const response = await fetch(u.toString(), req);

	// Handle 304 Not Modified - return null to indicate no changes
	if (response.status === 304) {
		return null;
	}

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText} ${u.pathname}`);
	}

	const contentType = response.headers.get('content-type');
	if (contentType?.includes('application/json')) {
		return await response.json();
	}

	return (await response.text()) as any;
}
