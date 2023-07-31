import { MaybePromise } from '../asyncs/MaybePromise';
import { FetchLike } from '../fetch';

export function createFetchWithProxyByUndici({
  proxy,
  token: _token,
  fetch,
  undici,
}: {
  proxy?: string;
  token?: string;
  fetch?: FetchLike;
  undici?: MaybePromise<{ fetch: any; ProxyAgent: any }>;
} = {}): FetchLike {
  if (!proxy) {
    return fetch || globalThis.fetch;
  }
  let agent: any;
  // https://github.com/nodejs/undici/blob/main/docs/best-practices/proxy.md
  return async (...args) => {
    const init = (args[1] ||= {}) as RequestInit & {
      duplex?: string;
      dispatcher?: any;
    };
    {
      const body = init.body;
      if (typeof body === 'object' && body && (body instanceof ReadableStream || Symbol.asyncIterator in body)) {
        // request.duplex must be set if request.body is ReadableStream or Async Iterables
        init.duplex ||= 'half';
      }
    }
    if (!agent) {
      let uri = proxy;
      let token = _token;
      {
        let u: URL | undefined;
        try {
          u = new URL(proxy);
        } catch (e) {}
        if (!token && u && (u.username || u.password)) {
          token = `Basic ${btoa(`${u.username || ''}:${u.password}`)}`;
          u.username = '';
          u.password = '';
          uri = u.toString();
        }
      }
      // if in next use 'next/dist/compiled/undici'
      undici ||= import('undici');
      const mod = await undici;
      const ProxyAgent = mod.ProxyAgent as new (_: any) => any;
      fetch ||= mod.fetch as FetchLike;
      // https://github.com/nodejs/undici/blob/main/docs/api/ProxyAgent.md
      agent = new ProxyAgent({
        uri,
        token,
      });
      // https://github.com/nodejs/node/issues/43187#issuecomment-1134634174
      // (global as any)[Symbol.for('undici.globalDispatcher.1')] = agent;
      // fixme should unwrap error https://github.com/nodejs/undici/issues/1248
    }
    init.dispatcher = agent;
    return await fetch!(...args);
  };
}
