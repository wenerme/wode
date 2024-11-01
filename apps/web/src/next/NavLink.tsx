'use client';

import React, { type FC, type ReactNode } from 'react';
import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { resolveActiveProps, type ActiveProps } from '../components/resolveActiveProps';

export const NavLink: FC<
  LinkProps &
    ActiveProps & {
      children?: ReactNode;
    }
> = ({ children, href, ...props }) => {
  const path = usePathname();
  const active = path === href;
  const { props: rest, className, style } = resolveActiveProps({ active, ...props });
  return (
    <Link
      href={href}
      data-active={active || null}
      {...{
        ...rest,
        style,
        className,
      }}
    >
      {children}
    </Link>
  );
};
