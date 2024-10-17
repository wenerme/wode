import type { ErrorInfo, FC, ReactNode } from 'react';
import { ErrorSuspenseBoundary as _ErrorSuspenseBoundary } from '@wener/reaction';
import { LoadingIndicator } from '../../../loader';
import { PageErrorState } from './PageErrorState';

export const ErrorSuspenseBoundary: FC<{
  fallback?: ReactNode;
  children: ReactNode;
  title?: ReactNode;
  onError?: (e: { error: Error; errorInfo: ErrorInfo }) => void;
}> = ({
  title,
  fallback = <LoadingIndicator />,
  onError = ({ error, errorInfo }) => {
    console.error(`[ErrorSuspenseBoundary]`, errorInfo, error);
  },
  children,
}) => {
  return (
    <_ErrorSuspenseBoundary
      fallback={fallback}
      renderError={(props) => <PageErrorState error={props.error} onReset={props.reset} title={title} />}
      onError={onError}
    >
      {children}
    </_ErrorSuspenseBoundary>
  );
};
