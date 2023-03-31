import { FetchLike } from '../fetch';

export function createFetchWithProxyByNextUndici({ proxy, fetch }: {
  proxy?: string;
  fetch?: FetchLike
} = {}): FetchLike {
  if (!proxy) {
    return fetch || globalThis.fetch;
  }
  let agent: any;
  return async (...args) => {
    if (!agent) {
      let ProxyAgent;
      if ('ProxyAgent' in globalThis) {
        ProxyAgent = (globalThis as any).ProxyAgent;
      } else {
        // @ts-ignore
        const undici = await import('next/dist/compiled/undici');
        ProxyAgent = undici.ProxyAgent;
        fetch ||= undici.fetch;
      }
      agent = new ProxyAgent(proxy);
      // https://github.com/nodejs/node/issues/43187#issuecomment-1134634174
      (global as any)[Symbol.for('undici.globalDispatcher.1')] = agent;
    }
    return fetch!(...args);
  };
}

// @ts-ignore
declare module 'next/dist/compiled/undici' {
  const fetch: FetchLike;
  const ProxyAgent: any;
  export { fetch, ProxyAgent };
}
