import { ChinaIdInfoPage } from '@src/components/cn/ChinaIdInfoPage';
import Head from 'next/head';

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
