import type { NextPage } from 'next';
import React from 'react';
import { ColorNameContent } from '@src/contents/web/ColorNameContent';

const Demo = () => {
  return (
    <div className={'container mx-auto'}>
      <ColorNameContent />
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
