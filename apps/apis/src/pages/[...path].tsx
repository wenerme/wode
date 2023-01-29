import React from 'react';
import { type GetStaticPaths, type GetStaticProps } from 'next';
import { arrayOfMaybeArray } from '@wener/utils';

export { default } from './index';

export const getStaticProps: GetStaticProps = async (ctx) => {
  const { params: { path } = {} } = ctx;
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
