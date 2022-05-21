import '../styles/globals.css';
import { NextPage } from 'next';
import type { AppProps } from 'next/app';
import NextNProgress from 'nextjs-progressbar';
import React, { ReactElement, ReactNode } from 'react';
import 'tailwindcss/tailwind.css';
import { PageLayout } from '@src/components/page/PageLayout';

function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout || ((page) => <PageLayout>{page}</PageLayout>);

  return (
    <>
      <NextNProgress color="#474DD2" options={{ showSpinner: false }} />
      {getLayout(<Component {...pageProps} />)}
    </>
  );
}

export default App;

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};
