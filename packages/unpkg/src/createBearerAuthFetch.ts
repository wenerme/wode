import { SimpleFetch } from './Unpkg';

export function createBearerAuthFetch(token: string | (() => string), fetch: SimpleFetch = globalThis.fetch) {
  return (url: string, init?: RequestInit) => {
    return fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${typeof token === 'function' ? token() : token}`,
      },
    });
  };
}
