import { FetchLike } from '../fetch';
import { createFetchWithProxyByNodeFetch } from '../server';
import { createFetchWithProxyByUndici } from './createFetchWithProxyByUndici';

export function createFetchWithProxy({ proxy, fetch }: { proxy?: string; fetch?: FetchLike }): FetchLike {
  if (!proxy) {
    return fetch || globalThis.fetch;
  }
  return parseInt(process.versions.node) >= 18
    ? createFetchWithProxyByUndici({ proxy, fetch })
    : createFetchWithProxyByNodeFetch({ proxy, fetch });
}
