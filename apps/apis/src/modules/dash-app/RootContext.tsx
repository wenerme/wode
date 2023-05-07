import React, { PropsWithChildren } from 'react';
import { ErrorSuspenseBoundary } from '@wener/reaction';
import { ThemeProvider } from 'common/src/daisy/theme';

export const RootContext: React.FC<PropsWithChildren> = ({ children }) => {
  return <ErrorSuspenseBoundary>{children}</ErrorSuspenseBoundary>;
};
