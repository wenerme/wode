import type { NextPage } from 'next';
import React from 'react';
import { UserAgentContent } from '@src/contents/web/UserAgentContent';

const CurrentPage: NextPage = () => {
  return (
    <div className={'container mx-auto py-4'}>
      <UserAgentContent />
    </div>
  );
};

export default CurrentPage;
