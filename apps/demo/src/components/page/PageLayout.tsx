import React from 'react';
import { PageHeader } from '@src/components/page/PageHeader';

export const PageLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <div>
      <PageHeader />
      {children}
    </div>
  );
};
