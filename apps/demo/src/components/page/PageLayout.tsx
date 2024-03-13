import React from 'react';
import { ThemeStateReactor } from '@wener/console/daisy';
import { PageHeader } from '@/components/page/PageHeader';

export const PageLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <>
      <PageHeader />
      <ThemeStateReactor />
      {children}
    </>
  );
};
