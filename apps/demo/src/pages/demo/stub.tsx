import type { NextPage } from 'next';
import React from 'react';

const Demo = () => {
  return (
    <>
      <div className={'flex mx-auto justify-center max-w-prose'}></div>
    </>
  );
};

const CurrentPage: NextPage = () => {
  return (
    <>
      <div className={'container mx-auto'}>
        <Demo />
      </div>
    </>
  );
};

export default CurrentPage;
