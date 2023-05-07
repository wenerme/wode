import React, { type ReactNode, useCallback, useState } from 'react';
import { Setup } from 'common/src/layouts';
import { getSiteConfStore } from 'common/src/system/components';
import { SessionProvider } from 'next-auth/react';
import { useStore } from 'zustand';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorSuspenseBoundary } from '@wener/reaction';
import { createReactClient, trpc } from '../utils/trpc';

export const RootContext: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 5 * 1000 } } }));
  const [trpcClient] = useState(() => createReactClient());
  const { basePath, baseUrl } = useStore(
    getSiteConfStore(),
    useCallback((s) => s.auth, []),
  );
  return (
    <ErrorSuspenseBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <SessionProvider basePath={basePath} baseUrl={baseUrl} refetchInterval={5 * 60}>
            <Setup>{children}</Setup>
          </SessionProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorSuspenseBoundary>
  );
};
