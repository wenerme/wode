import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';

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
