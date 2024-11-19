import React, { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';
import { useDebounce } from '@wener/reaction';
import { cn } from '../tw';
import { ErrorPlaceholder } from './ErrorPlaceholder';

export const NotReadyPlaceholder: FC<
  {
    loading?: boolean;
    error?: any;
    content?: ReactNode;
    refetch?: () => void;
    empty?: boolean | number;
  } & Omit<ComponentPropsWithoutRef<'div'>, 'content'>
> = ({ loading, refetch, empty, children, error, className, content = children, ...props }) => {
  // 200-500ms
  const _loading = useDebounce(loading, 250);
  if (_loading) {
    return (
      <div
        data-state={'loading'}
        className={cn('loading loading-spinner h-4 w-4 opacity-75', className)}
        {...props}
      ></div>
    );
  }
  if (error) {
    return <ErrorPlaceholder data-state={'error'} error={error} className={className} {...props} />;
  }
  if (empty !== undefined && !empty) {
    return (
      <div data-state={'empty'} className={cn(className)} {...props}>
        没有数据
      </div>
    );
  }
  return content;
};
