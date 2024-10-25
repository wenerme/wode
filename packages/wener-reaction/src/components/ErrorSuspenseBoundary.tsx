import React, { Suspense, type FC, type ReactNode } from 'react';
import { ErrorBoundary, type ErrorBoundaryProps } from './ErrorBoundary';

export const ErrorSuspenseBoundary: FC<{ fallback?: ReactNode } & ErrorBoundaryProps> = ({
  fallback,
  renderError,
  onError = ({ error, errorInfo }) => console.error(`ErrorSuspenseBoundary: `, errorInfo, error),
  children,
}) => {
  return (
    <ErrorBoundary renderError={renderError} onError={onError}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
};
