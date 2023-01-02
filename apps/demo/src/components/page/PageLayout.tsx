import React from 'react';
import { ThemeStateReactor } from 'common/src/daisy/theme';
import { PageHeader } from '@src/components/page/PageHeader';

export const PageLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <>
      <PageHeader />
      <ThemeStateReactor />
      {children}
    </>
  );
};
