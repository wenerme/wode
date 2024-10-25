import React, { Suspense, type ComponentPropsWithoutRef, type FC } from 'react';
import { cn } from '@wener/console';
import { LoadingIndicator } from '@wener/console/loader';

export const PageContainer: FC<ComponentPropsWithoutRef<'div'>> = ({ children, className }) => {
  return (
    <div className={cn('container mx-auto flex-1', className)}>
      <Suspense fallback={<LoadingIndicator />}>{children}</Suspense>
    </div>
  );
};
