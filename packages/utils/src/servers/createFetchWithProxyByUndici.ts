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
    const init = (args[1] ||= {});
    if (init.body instanceof ReadableStream) {
      // https://github.com/nodejs/node/issues/46221
      (init as any).duplex ||= 'half';
    }
    if (!agent) {
      // process.env.__NEXT_VERSION
      // process.env.NEXT_RUNTIME
      if (process.env.__NEXT_VERSION) {
        // @ts-ignore
        undici ||= import('next/dist/compiled/undici');
      }
      // @ts-ignore
      undici ||= import('undici');
      const mod = await undici;
      const ProxyAgent = mod.ProxyAgent;
      fetch ||= mod.fetch;
      agent = new ProxyAgent(proxy);
      // https://github.com/nodejs/node/issues/43187#issuecomment-1134634174
      // (global as any)[Symbol.for('undici.globalDispatcher.1')] = agent;
    }
    (init as any).dispatcher = agent;
    return fetch!(...args);
  };
}
