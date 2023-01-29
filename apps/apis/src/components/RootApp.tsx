import React, { useState } from 'react';
import { Setup } from 'common/src/layouts';
import { getBaseUrl } from 'common/src/runtime';
import { SessionProvider } from 'next-auth/react';
import superjson from 'superjson';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { ErrorSuspenseBoundary } from '@wener/reaction';
import App from '../components/App';
import { trpc } from '../utils/trpc';

export const RootApp: React.FC<{ path?: string }> = ({ path }) => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
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
        }),
      ],
    }),
  );
  return (
    <ErrorSuspenseBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <SessionProvider basePath={'/auth/api/auth'} refetchInterval={5 * 60}>
            <Setup>
              <App path={path} />
            </Setup>
          </SessionProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorSuspenseBoundary>
  );
};
