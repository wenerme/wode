import Head from 'next/head';

export const PageHead = () => {
  return (
    <Head>
      <title>Demo Page</title>
      <meta name="description" content="Wener's demo web app for various web tech, react libs" />
      <link rel="icon" href="/favicon.ico" type="image/ico" />
      <link rel="icon" href="/assets/images/svg/logo.svg" type="image/svg+xml" />
      <link rel="icon" type="image/png" sizes="128x128" href="/favicon.png" />
      <link rel="shortcut icon" href="/favicon.png" />
    </Head>
  );
};
