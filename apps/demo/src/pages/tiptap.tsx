import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const Content = dynamic({
  loader: () => import('@src/contents/TipTap/TipTapPageContent'),
  loading: () => <div>Loading...</div>,
});

const CurrentPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>TipTap Editor</title>
      </Head>
      <Content />
    </>
  );
};

export default CurrentPage;
