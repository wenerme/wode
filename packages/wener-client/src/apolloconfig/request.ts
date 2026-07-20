import { createHmac } from 'node:crypto';
import type { FetchLike } from '@wener/utils';
import { parseJsonResponse } from '../utils/parseJsonResponse';
import { resolveRequest } from '../utils/resolveRequest';

export type RequestOptions = {
	url: string;
	baseUrl?: string;
	params?: Record<string, any>;
	data?: any;
	headers?: Record<string, string>;
	method?: string;
	fetch?: FetchLike;
	signal?: AbortSignal;
	// Apollo Config authentication
	appId?: string;
	appSecret?: string;
};

export function sign(urlPath: string, timestamp: string, appSecret: string): string {
	const stringToSign = `${timestamp}\n${urlPath}`;
	return createHmac('sha1', appSecret).update(stringToSign, 'utf8').digest('base64');
}

export async function request<O = any>(options: RequestOptions): Promise<O> {
	const { fetch = globalThis.fetch, appId, appSecret, headers = {}, ...restOptions } = options;

	// Resolve base request
	const resolved = resolveRequest(restOptions);

	// Add Apollo Config authentication if configured
	if (appSecret && appId) {
		const timestamp = Date.now().toString();
		const pathAndQuery = resolved.url.pathname + (resolved.url.search || '');
		const signature = sign(pathAndQuery, timestamp, appSecret);

		resolved.headers.set('Authorization', `Apollo ${appId}:${signature}`);
		resolved.headers.set('Timestamp', timestamp);
	}

	// Add any additional headers that were passed in
	for (const [key, value] of Object.entries(headers)) {
		resolved.headers.set(key, value);
	}

	const response = await fetch(resolved.url.toString(), resolved.init);

	if (!response.ok) {
		// {"timestamp":"","status":404,"error":"Not Found","path":"/configfiles/json/app/default/conf.yaml"}
		throw Object.assign(new Error(`HTTP ${response.status}: ${response.statusText} ${resolved.url.pathname}`), {
			status: response.status,
		});
	}

	return parseJsonResponse<O>(response);
}
