import type { NextPage } from 'next';
import Head from 'next/head';
import { HomePageContent } from '../contents/Home/HomePageContent';
import { TipTapPageContent } from '@src/contents/TipTap/TipTapPageContent';

const CurrentPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>TipTap Editor</title>
      </Head>
      <TipTapPageContent />
    </>
  );
};

export default CurrentPage;
