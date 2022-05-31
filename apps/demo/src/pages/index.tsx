import type { NextPage } from 'next';
import Head from 'next/head';
import { HomePageContent } from '../contents/Home/HomePageContent';
import { PageHead } from '@src/components/page/PageHead';

const CurrentPage: NextPage = () => {
  return (
    <>
      <HomePageContent />
    </>
  );
};

export default CurrentPage;
