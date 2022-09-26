import React from 'react';
import type { NextPage } from 'next';
import { UserAgentContent } from '@src/contents/web/UserAgentContent';

const CurrentPage: NextPage = () => {
  return (
    <div className={'container mx-auto py-4'}>
      <UserAgentContent />
    </div>
  );
};

export default CurrentPage;
