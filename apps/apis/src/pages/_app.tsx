import React from 'react';
import { Setup } from 'common/src/layouts';
import 'common/src/styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import type { AppProps, AppType } from 'next/app';
import { trpc } from '../utils/trpc';

const PrimaryApp: AppType = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => (
  <SessionProvider session={session} basePath={'/auth/api/auth'} refetchInterval={5 * 60}>
    <Setup>
      <Component {...pageProps} />
    </Setup>
  </SessionProvider>
);

export default trpc.withTRPC(PrimaryApp);
