import type { FetchLike } from '@wener/utils';

export function createBearerAuthFetch(token: string | (() => string), fetch: FetchLike = globalThis.fetch) {
	return (url: string, init?: RequestInit) => {
		return fetch(url, {
			...init,
			headers: { ...init?.headers, Authorization: `Bearer ${typeof token === 'function' ? token() : token}` },
		});
	};
}
