import React, { type ComponentPropsWithRef, type ComponentType, type ReactElement } from 'react';
import { NavLink as RRNavLink, useInRouterContext } from 'react-router';
import { StaticNavLink } from './StaticNavLink';

export type NavLinkProps = Omit<ComponentPropsWithRef<'a'>, 'children' | 'className' | 'href'> & {
	children: ReactElement | ((o: { isActive: boolean }) => ReactElement);
	className: string | ((o: { isActive: boolean }) => string);
	href: string;
};

// export interface NavLinkProps extends Omit<ComponentPropsWithRef<'a'>, 'children' | 'className'> {
// 	children: ReactElement | ((o: { isActive: boolean }) => ReactElement);
// 	className: string | ((o: { isActive: boolean }) => string);
// }

export interface AutoNavLinkProps extends NavLinkProps {
	href: string;
	end?: boolean;
}

export const NavLink = (props: AutoNavLinkProps) => {
	const csr = useInRouterContext();
	if (csr) {
		const { href, ...rest } = props;
		return <RRNavLink to={href} {...rest} />;
	}
	return <StaticNavLink {...props} />;
};

export const ReactRouterNavLink = ({ href, to = href, ...props }: any) => {
	return <RRNavLink to={to} {...props} />;
};

const _NavLink = (props: NavLinkProps) => {
	const csr = useInRouterContext();
	if (csr) {
		const { href, ...rest } = props;
		return <RRNavLink to={href} {...rest} />;
	}
	return <StaticNavLink {...props} />;
};
