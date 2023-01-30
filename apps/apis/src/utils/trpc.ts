import { getOriginUrl } from 'common/src/runtime';
import { getSiteConf } from 'common/src/system/components';
import superjson from 'superjson';
import { createTRPCProxyClient, httpBatchLink, type TRPCClientRuntime, type TRPCLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();

export function createReactClient() {
  return trpc.createClient({
    transformer: superjson,
    links: [createClientLink()],
  });
}

let trpcClient;

export function getTrpcProxyClient() {
  // wait site conf
  return (trpcClient ??= createTRPCProxyClient<AppRouter>(createClientOptions()));
}

function createClientOptions() {
  return {
    transformer: superjson,
    links: [createClientLink()],
  };
}

function getApiOriginUrl() {
  const origin = getSiteConf().api.origin;
  if (origin) {
    return origin;
  }
  // vite
  try {
    return import.meta.env.VITE_API_ORIGIN_URL || getOriginUrl();
  } catch {}
  // nextjs
  return process.env.NEXT_PUBLIC_API_ORIGIN_URL || getOriginUrl();
}

function createClientLink(): TRPCLink<AppRouter> {
  return (runtime: TRPCClientRuntime) => {
    // 多服务
    const root = getApiOriginUrl();
    const servers = {
      default: httpBatchLink({
        url: `${root}/api/trpc`,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          });
        },
        headers() {
          return {
            // authorization: getAuthCookie(),
          };
        },
      })(runtime),
      wecom: httpBatchLink({ url: `${root}/wecom/api/trpc` })(runtime),
    };
    return (ctx) => {
      const { op } = ctx;
      const pathParts = op.path.split('.');

      let serverName = pathParts.shift() as string as keyof typeof servers;
      let path = pathParts.join('.');
      if (!servers[serverName]) {
        path = op.path;
        serverName = 'default';
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`> calling ${serverName} on path ${path}`, {
          input: op.input,
        });
      }

      const link = servers[serverName];
      return link({
        ...ctx,
        op: {
          ...op,
          path,
        },
      });
    };
  };
}
