import { FetchLike } from '@wener/utils';
import { fetch, ProxyAgent } from 'undici';

export function createFetchWithProxy2({ proxy }: { proxy?: string }) {
  if (!proxy) {
    return { fetch: globalThis.fetch };
  }

  const u = new URL(proxy);
  const uu = new URL(proxy);
  uu.username = '';
  uu.password = '';
  let agent = new ProxyAgent({
    proxyTls: {
      // NOTE 避免 https 代理异常
      rejectUnauthorized: false,
    },
    // uri: u.origin + u.pathname,
    uri: uu.toString(),
    // same as proxy-authorization header
    token:
      u.username || u.password
        ? `Basic ${Buffer.from(`${decodeURIComponent(u.username)}:${decodeURIComponent(u.password)}`).toString('base64')}`
        : undefined,
    // @ts-ignore
    protocol: u.protocol,
    // clientFactory: (origin, opts) => {
    //   return new Pool(origin, {
    //     ...opts,
    //     connect: (...args) => {
    //       return opts.connect.apply(null, args);
    //     },
    //   });
    // },
  });

  const _fetch: FetchLike = async (...args) => {
    const init = (args[1] ||= {}) as RequestInit & {
      duplex?: string;
      dispatcher?: any;
    };
    {
      const body = init.body;
      if (typeof body === 'object' && body && (body instanceof ReadableStream || Symbol.asyncIterator in body)) {
        // request.duplex must be set if request.body is ReadableStream or Async Iterables
        if (!init.duplex) {
          init.duplex = 'half';
        }
      }
    }
    init.dispatcher = agent;
    return await (fetch as any)!(...args);
  };

  return {
    fetch: _fetch,
    agent,
  };
}
