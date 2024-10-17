import { forwardRef, type ComponentProps, type ElementType, type ReactNode } from 'react';
import { cn } from '../../tw/cn';

export type LeftContentRightLayoutProps<E extends ElementType = 'div'> = Omit<ComponentProps<E>, 'as'> & {
  as?: E;
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
};
export const LeftContentRightLayout = forwardRef<HTMLDivElement, LeftContentRightLayoutProps>(
  ({ left, right, children, className, ...props }, ref) => {
    return (
      <div className={cn('flex w-full flex-row', className)} ref={ref} {...props}>
        {left}
        <main className={'LeftContentRightLayout__Content relative flex-1'}>
          <div className={'absolute inset-0 overflow-auto @container'}>{children}</div>
        </main>
        {right}
      </div>
    );
  },
) as <E extends ElementType = 'div'>(props: LeftContentRightLayoutProps<E>) => JSX.Element;
