import type { ComponentPropsWithRef, ComponentType, ReactElement } from 'react';
import { NavLink as RRNavLink, useInRouterContext } from 'react-router';
import { StaticNavLink } from './StaticNavLink';

// React Router 8's declaration can resolve React types from a different workspace
// package instance. Keep this adapter boundary independent of that declaration.
const RouterNavLink = RRNavLink as unknown as ComponentType<any>;

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
		return <RouterNavLink to={href} {...rest} />;
	}
	return <StaticNavLink {...props} />;
};

export const ReactRouterNavLink = ({ href, to = href, ...props }: any) => {
	return <RouterNavLink to={to} {...props} />;
};

const _NavLink = (props: NavLinkProps) => {
	const csr = useInRouterContext();
	if (csr) {
		const { href, ...rest } = props;
		return <RouterNavLink to={href} {...rest} />;
	}
	return <StaticNavLink {...props} />;
};
