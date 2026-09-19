'use client';

import { type MaybeFunction, maybeFunction } from '@wener/utils';
import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ComponentPropsWithoutRef, forwardRef, type ReactNode } from 'react';

export interface NextNavLinkProps extends Omit<ComponentPropsWithoutRef<typeof Link>, 'children' | 'className'> {
	children?: MaybeFunction<ReactNode, [{ isActive: boolean }]>;
	className?: MaybeFunction<string, [{ isActive: boolean }]>;
	activeClassName?: string;
	inactiveClassName?: string;
}

export const NextNavLink = forwardRef<HTMLAnchorElement, NextNavLinkProps>(
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
