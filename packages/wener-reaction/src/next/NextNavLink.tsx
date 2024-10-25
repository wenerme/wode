'use client';

import React, { forwardRef, type ComponentProps, type FC, type ReactNode } from 'react';
import { maybeFunction, type MaybeFunction } from '@wener/utils';
import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NextNavLinkProps extends Omit<ComponentProps<typeof Link>, 'children' | 'className'> {
  children?: MaybeFunction<ReactNode, [{ isActive: boolean }]>;
  className?: MaybeFunction<string, [{ isActive: boolean }]>;
  activeClassName?: string;
  inactiveClassName?: string;
}

export const NextNavLink: FC<NextNavLinkProps> = forwardRef(
  ({ children, activeClassName, inactiveClassName, className, ...props }, ref) => {
    let pathname = usePathname();
    let isActive = pathname === props.href;
    return (
      <Link
        {...props}
        ref={ref}
        className={clsx(maybeFunction(className, { isActive }), isActive ? activeClassName : inactiveClassName)}
      >
        {maybeFunction(children, { isActive })}
      </Link>
    );
  },
);
