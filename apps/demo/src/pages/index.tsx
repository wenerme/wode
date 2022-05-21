import type { NextPage } from 'next';
import Head from 'next/head';
import { HomePageContent } from '../contents/Home/HomePageContent';

const CurrentPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Demo Page</title>
      </Head>
      <HomePageContent />
    </>
  );
};

export default CurrentPage;
