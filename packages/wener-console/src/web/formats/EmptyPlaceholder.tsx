import type { ComponentProps, ElementType, ReactNode } from 'react';
import { clsx } from 'clsx';

export type EmptyPlaceholderProps<E extends ElementType> = Omit<ComponentProps<E>, 'as'> & {
  as?: E;
  children?: ReactNode;
};

export function EmptyPlaceholder<T extends ElementType = 'span'>({
  as,
  className,
  children = '无',
  ...rest
}: EmptyPlaceholderProps<T>) {
  const As = as || 'span';
  return (
    <As className={clsx('opacity-70', className)} {...rest}>
      {children}
    </As>
  );
}
