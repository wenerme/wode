import React from 'react';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { useMounted } from '@wener/reaction';
import { arrayOfMaybeArray } from '@wener/utils';

const Content = React.lazy(() => import('../components/WenerApisApp'));
const CurrentPage = () => {
  const ok = useMounted();
  if (!ok) {
    return null;
  }
  return (
    <>
      <Content />
    </>
  );
};
export default CurrentPage;

export const getStaticProps: GetStaticProps = async ({ params: { path } = {} }) => {
  return {
    props: {
      path: arrayOfMaybeArray(path).join('/'),
    },
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: ['/ipfs', '/hash'],
    fallback: true,
  };
};
