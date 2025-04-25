import React, { type ComponentPropsWithRef, type ReactElement } from 'react';
import { NavLink, useInRouterContext } from 'react-router-dom';
import { StaticNavLink } from './StaticNavLink';

export interface NavLinkProps extends Omit<ComponentPropsWithRef<'a'>, 'children' | 'className'> {
	children: ReactElement | ((o: { isActive: boolean }) => ReactElement);
	className: string | ((o: { isActive: boolean }) => string);
}

export interface AutoNavLinkProps extends NavLinkProps {
	href: string;
	end?: boolean;
}

export const AutoNavLink = (props: AutoNavLinkProps) => {
	const csr = useInRouterContext();
	if (csr) {
		const { href, ...rest } = props;
		return <NavLink to={href} {...rest} />;
	}
	return <StaticNavLink {...props} />;
};

export const ReactRouterNavLink = ({ href, to = href, ...props }: any) => {
	return <NavLink to={to} {...props} />;
};
