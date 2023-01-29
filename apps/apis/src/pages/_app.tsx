import React from 'react';
import 'common/src/styles/globals.css';
import { AppProps, AppType } from 'next/app';

// import { Setup } from 'common/src/layouts';
// import { SessionProvider } from 'next-auth/react';
// import type { AppProps, AppType } from 'next/app';
// import { trpc } from '../utils/trpc';
// const PrimaryApp: AppType = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => (
//   <SessionProvider session={session} basePath={'/auth/api/auth'} refetchInterval={5 * 60}>
//     <Setup>
//       <Component {...pageProps} />
//     </Setup>
//   </SessionProvider>
// );
//
// export default PrimaryApp;

const PrimaryApp: AppType = ({ Component, pageProps }: AppProps) => <Component {...pageProps} />;

export default PrimaryApp;
