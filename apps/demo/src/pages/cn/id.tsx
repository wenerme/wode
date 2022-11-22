import Head from 'next/head';
import { ChinaIdInfoPage } from '@src/components/cn/ChinaIdInfoPage';

const CurrentPage = () => {
  return (
    <>
      <Head>
        <title>ID 信息解析</title>
      </Head>
      <ChinaIdInfoPage />
    </>
  );
};

export default CurrentPage;
