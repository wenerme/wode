import { MaybePromise } from 'rollup';
import { FetchLike } from '../fetch';

export function createFetchWithProxyByUndici({
  proxy,
  fetch,
  undici,
}: {
  proxy?: string;
  fetch?: FetchLike;
  undici?: MaybePromise<{ fetch: any; ProxyAgent: any }>;
} = {}): FetchLike {
  if (!proxy) {
    return fetch || globalThis.fetch;
  }
  let agent: any;
  return async (...args) => {
    const init: RequestInit & { duplex?: string; dispatcher?: any } = (args[1] ||= {});
    if (init.body instanceof ReadableStream) {
      // https://github.com/nodejs/node/issues/46221
      init.duplex ||= 'half';
    }
    if (!agent) {
      // if in next use 'next/dist/compiled/undici'
      undici ||= import('undici');
      const mod = await undici;
      const ProxyAgent = mod.ProxyAgent;
      fetch ||= mod.fetch;
      agent = new ProxyAgent(proxy);
      // https://github.com/nodejs/node/issues/43187#issuecomment-1134634174
      // (global as any)[Symbol.for('undici.globalDispatcher.1')] = agent;
    }
    init.dispatcher = agent;
    return await fetch!(...args);
  };
}
