'use client';

import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import React, { type FC, type ReactNode } from 'react';
import { type ActiveProps, resolveActiveProps } from '../components/resolveActiveProps';

export const NavLink: FC<LinkProps & ActiveProps & { children?: ReactNode }> = ({ children, href, ...props }) => {
	const path = usePathname();
	const active = path === href;
	const { props: rest, className, style } = resolveActiveProps({ active, ...props });
	return (
		<Link href={href} data-active={active || null} {...{ ...rest, style, className }}>
			{children}
		</Link>
	);
};
