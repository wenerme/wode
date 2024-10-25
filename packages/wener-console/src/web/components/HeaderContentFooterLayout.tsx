import React, { forwardRef, type ComponentProps, type ElementType, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../tw/cn';

export type HeaderContentFooterLayoutProps<E extends ElementType = 'div'> = Omit<ComponentProps<E>, 'as'> & {
  as?: E;
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
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
) as <E extends ElementType = 'div'>(props: HeaderContentFooterLayoutProps<E>) => ReactElement;
