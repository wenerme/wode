import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';

const Content = dynamic({
  loader: () => import('@/contents/TipTap/TipTapPageContent'),
  loading: () => <div>Loading...</div>,
  ssr: false,
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
