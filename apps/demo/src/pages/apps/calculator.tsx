import type { NextPage } from 'next';
import Head from 'next/head';
import { Calculator } from '../../apps/Calculator/Calculator';

const CurrentPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Demo Calculator</title>
      </Head>
      <div className={'container mx-auto'}>
        <Calculator />
      </div>
    </>
  );
};

export default CurrentPage;
