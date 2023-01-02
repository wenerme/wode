import React from 'react';
import type { NextPage } from 'next';
import { ColorNameContent } from '../../contents/web/ColorNameContent';

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
