import { getOriginUrl } from 'common/src/runtime';
import superjson from 'superjson';
import { createTRPCProxyClient, httpBatchLink, TRPCClientRuntime, TRPCLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();

export function createReactClient() {
  return trpc.createClient({
    transformer: superjson,
    links: [createClientLink()],
  });
}

// export const trpc = createTRPCNext<AppRouter>({
//   config({ ctx }) {
//     return {
//       transformer: superjson,
//       links: [
//         httpBatchLink({
//           /**
//            * If you want to use SSR, you need to use the server's full URL
//            * @link https://trpc.io/docs/ssr
//            **/
//           url: `${getBaseUrl()}/api/trpc`,
//           fetch(url, options) {
//             return fetch(url, {
//               ...options,
//               credentials: 'include',
//             });
//           },
//         }),
//       ],
//       /**
//        * @link https://tanstack.com/query/v4/docs/reference/QueryClient
//        **/
//       queryClientConfig: { defaultOptions: { queries: { staleTime: 60 * 5 * 1000 } } },
//     };
//   },
//   /**
//    * @link https://trpc.io/docs/ssr
//    **/
//   ssr: true,
// });

export const trpcClient = createTRPCProxyClient<AppRouter>(createClientOptions());

function createClientOptions() {
  return {
    transformer: superjson,
    links: [createClientLink()],
  };
}

function getApiOriginUrl() {
  // vite
  try {
    return import.meta.env.VITE_SERVER_ORIGIN_URL || 'https://apis.wener.me';
  } catch {}
  // nextjs
  return getOriginUrl();
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
      const serverName = pathParts.shift() as string as keyof typeof servers;

      const path = pathParts.join('.');

      if (process.env.NODE_ENV === 'development') {
        console.log(`> calling ${serverName} on path ${path}`, {
          input: op.input,
        });
      }

      const link = servers[serverName] || servers.default;
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
