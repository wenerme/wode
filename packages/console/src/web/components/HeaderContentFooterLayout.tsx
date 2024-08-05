import React, { forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type HeaderContentFooterLayoutProps<E extends React.ElementType = 'div'> = Omit<
  React.ComponentProps<E>,
  'as'
> & {
  as?: E;
  header?: ReactNode;
  footer?: ReactNode;
  children?: React.ReactNode;
};

export const HeaderContentFooterLayout = forwardRef<HTMLDivElement, HeaderContentFooterLayoutProps>(
  ({ header, as, footer, children, className, ...props }, ref) => {
    const As = as || 'div';
    return (
      <As className={cn('flex h-full flex-col', className)} ref={ref} {...props}>
        {header}
        <main className={'HeaderContentFooterLayout__Content relative flex-1'}>
          <div className={'absolute inset-0 overflow-auto @container'}>{children}</div>
        </main>
        {footer}
      </As>
    );
  },
) as <E extends React.ElementType = 'div'>(props: HeaderContentFooterLayoutProps<E>) => React.ReactElement;
