import React, { forwardRef, type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';
import { cn } from '../tw';

export type LeftCenterRightLayoutProps = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
} & ComponentPropsWithoutRef<'div'>;
export const LeftCenterRightLayout: FC<LeftCenterRightLayoutProps> = forwardRef<
  HTMLDivElement,
  LeftCenterRightLayoutProps
>(({ left, center, right, className, children, ...props }, ref) => {
  return (
    <div className={cn('flex items-center', className)} ref={ref} {...props}>
      <div className={'flex items-center'}>{left}</div>
      <div className={'relative flex h-full flex-1'}>
        <div className={'absolute inset-0 flex flex-wrap items-center overflow-x-auto'}>
          {center}
          {children}
        </div>
      </div>
      <div className={'flex items-center'}>{right}</div>
    </div>
  );
});
