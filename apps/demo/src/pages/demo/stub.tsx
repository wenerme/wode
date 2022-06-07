import type { NextPage } from 'next';
import React from 'react';

const Demo = () => {
  return (
    <div className={'container mx-auto'}>
      <div className={'flex mx-auto justify-center max-w-prose'}></div>
    </div>
  );
};

const CurrentPage: NextPage = () => {
  return (
    <>
      <Demo />
    </>
  );
};

export default CurrentPage;
