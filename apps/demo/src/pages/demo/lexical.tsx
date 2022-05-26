import type { NextPage } from 'next';
import Head from 'next/head';
import { LexicalDemoContent } from '@src/contents/LexicalDemo/LexicalDemoContent';

const CurrentPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Lexical Editor</title>
      </Head>
      <LexicalDemoContent />
    </>
  );
};

export default CurrentPage;
