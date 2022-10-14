import React from 'react';
import { PageHeader } from '@src/components/page/PageHeader';
import { ThemeStateReactor } from '@src/daisy/theme/useTheme';

export const PageLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <>
      <PageHeader />
      <ThemeStateReactor />
      {children}
    </>
  );
};
