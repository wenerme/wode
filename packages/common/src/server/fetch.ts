import { HttpsProxyAgent } from 'https-proxy-agent';
import nodeFetch from 'node-fetch';

export type FetchLike = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

export function createProxyFetch(proxy = process.env.FETCH_PROXY, _fetch?: FetchLike) {
  if (!proxy) {
    return _fetch || globalThis.fetch;
  }

  // fixme node 18 不支持 agent proxy
  const fetch = _fetch || (nodeFetch as FetchLike);

  const agent = new HttpsProxyAgent(proxy);
  return (url: string | URL | Request, init?: RequestInit) => {
    if (url instanceof Request) {
      return fetch(url.url, {
        ...url,
        ...init,
        agent,
      } as any);
    }
    return fetch(url, {
      ...init,
      agent,
    } as any);
  };
}
