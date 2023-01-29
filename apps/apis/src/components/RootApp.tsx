import React, { useState } from 'react';
import { Setup } from 'common/src/layouts';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorSuspenseBoundary } from '@wener/reaction';
import App from '../components/App';
import { createReactClient, trpc } from '../utils/trpc';

export const RootApp: React.FC<{ path?: string }> = ({ path }) => {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 5 * 1000 } } }));
  const [trpcClient] = useState(() => createReactClient());
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
