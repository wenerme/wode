import React from 'react';
import { PageHeader } from '@src/components/page/PageHeader';
import { ThemeStateReactor } from '@wener/console/daisy';

export const PageLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <>
      <PageHeader />
      <ThemeStateReactor />
      {children}
    </>
  );
};
