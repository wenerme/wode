import React from 'react';
import { clsx } from 'clsx';

export type EmptyPlaceholderProps<E extends React.ElementType> = Omit<React.ComponentProps<E>, 'as'> & {
  as?: E;
  children?: React.ReactNode;
};

export function EmptyPlaceholder<T extends React.ElementType = 'span'>({
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
