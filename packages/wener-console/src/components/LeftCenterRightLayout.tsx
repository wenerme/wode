import React, { type ComponentPropsWithRef, type ElementType, type ReactNode } from 'react';
import { cn } from '../tw';

export type LeftCenterRightLayoutProps<E extends ElementType = 'div'> = ComponentPropsWithRef<E> & {
  as?: E;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
};
export const LeftCenterRightLayout = <E extends ElementType = 'div'>({
  as: As = 'div',
  left,
  center,
  right,
  className,
  children,
  ref,
  ...props
}: LeftCenterRightLayoutProps<E>) => {
  return (
    <As className={cn('flex items-center', className)} ref={ref} {...props}>
      {left}
      <div className={'relative flex h-full flex-1'}>
        <div className={'absolute inset-0 flex flex-wrap items-center overflow-x-auto'}>
          {center}
          {children}
        </div>
      </div>
      {right}
    </As>
  );
};
