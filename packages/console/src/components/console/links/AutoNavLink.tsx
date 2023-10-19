import React, { forwardRef } from 'react';
import { NavLink, useInRouterContext } from 'react-router-dom';
import type { BaseNavLinkProps } from './BaseNavLink';
import { StaticNavLink } from './StaticNavLink';

export interface AutoNavLinkProps extends BaseNavLinkProps {
  href: string;
}

export const AutoNavLink = /* @__PURE__ */ forwardRef<any, AutoNavLinkProps>((props, ref) => {
  const csr = useInRouterContext();
  if (csr) {
    const { href, ...rest } = props;
    return <NavLink ref={ref} to={href} {...rest} />;
  }
  return <StaticNavLink ref={ref} {...props} />;
});

export const ReactRouterNavLink = ({ href, to = href, ...props }: any) => {
  return <NavLink to={to} {...props} />;
};
