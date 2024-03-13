import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';

const App = dynamic(() => import('@/contents/LexicalDemo/LexicalDemoContent'), { ssr: false });
const CurrentPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Lexical Editor</title>
      </Head>
      <App />
    </>
  );
};

export default CurrentPage;
