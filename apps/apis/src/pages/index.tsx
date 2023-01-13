import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { ErrorSuspenseBoundary } from '@wener/reaction';

const Content = dynamic(() => import('../components/WenerApisApp'), { ssr: false });

const CurrentPage: React.FC<{ path?: string }> = ({ path }) => {
  return (
    <>
      <Head>
        <title>Wener&apos;s APIs</title>
      </Head>
      <ErrorSuspenseBoundary>
        <Content path={path} />
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
