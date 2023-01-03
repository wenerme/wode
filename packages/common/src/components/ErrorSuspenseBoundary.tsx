import type { ReactNode} from 'react';
import React, { Suspense } from 'react';
import { ErrorBoundary } from '@wener/reaction';
import { PageErrorState } from './PageErrorState';
import { LoadingIndicator } from './loaders/LoadingIndicator';

export const ErrorSuspenseBoundary: React.FC<{ fallback?: ReactNode; children: ReactNode }> = ({
  fallback = <LoadingIndicator />,
  children,
}) => {
  return (
    <ErrorBoundary
      renderError={(props) => <PageErrorState {...props} />}
      onError={({ error, errorInfo }) => console.error(`Content`, errorInfo, error)}
    >
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
};
