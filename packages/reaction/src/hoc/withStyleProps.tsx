import React, { ComponentType, createElement, forwardRef } from 'react';

export function withStyleProps<T extends keyof JSX.IntrinsicElements, P extends JSX.IntrinsicElements[T], D extends P>(
  base: T,
  def: D,
): React.ComponentType<Omit<P, keyof D> & Partial<D>>;

export function withStyleProps<T extends ComponentType<P>, P extends {}>(base: T, def: P): React.ComponentType<P> {
  let Next = forwardRef<T, P>(({ className, style, ...props }: any, ref) =>
    createElement(base, {
      ...def,
      className: [(def as any).className, className].filter(Boolean).join(' '),
      style: { ...(def as any).style, style },
      ...props,
      ref,
    }),
  );
  if (base.displayName) {
    Next.displayName = base.displayName;
  }
  return Next as any;
}
