import '../styles/globals.css';
import { NextPage } from 'next';
import type { AppProps } from 'next/app';
import NextNProgress from 'nextjs-progressbar';
import React from 'react';
import { PageLayout } from '@src/components/page/PageLayout';
import { PageHead } from '@src/components/page/PageHead';

function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout =
    Component.getLayout ||
    ((page: any) => (
      <PageLayout>
        <PageHead />
        {page}
      </PageLayout>
    ));

  return (
    <>
      <NextNProgress color="#474DD2" options={{ showSpinner: false }} />
      {getLayout(<Component {...pageProps} />)}
    </>
  );
}

export default App;

type NextPageWithLayout = NextPage & {
  getLayout?: (page: React.ReactNode) => React.ReactNode;
};

type AppPropsWithLayout = AppProps & {
  // Component: NextPageWithLayout;
  Component: any;
};
