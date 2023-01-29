import React from 'react';
import Head from 'next/head';
import { ErrorSuspenseBoundary } from '@wener/reaction';
import { RootApp } from '../components/RootApp';

// const Content = dynamic(() => import('../components/WenerApisApp'), {
//   ssr: false,
// });

const CurrentPage: React.FC<{ path?: string }> = ({ path }) => {
  return (
    <>
      <Head>
        <title>Wener&apos;s APIs</title>
      </Head>
      <ErrorSuspenseBoundary>
        <RootApp path={path} />
      </ErrorSuspenseBoundary>
    </>
  );
};
export default CurrentPage;

// NOTE SSR not generate as expected
// export const getStaticProps: GetStaticProps = async (ctx) => {
//   const { params: { path } = {} } = ctx;
//   return {
//     props: {
//       path: arrayOfMaybeArray(path).join('/'),
//     },
//   };
// };
//
// export const getStaticPaths: GetStaticPaths = () => {
//   return {
//     paths: ['/ipfs', '/hash'],
//     fallback: true,
//   };
// };
