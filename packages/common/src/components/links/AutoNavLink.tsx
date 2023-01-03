import React, { forwardRef } from 'react';
import { NavLink, useInRouterContext } from 'react-router-dom';
import type { BaseNavLinkProps } from './BaseNavLink';
import { NextNavLink } from './NextNavLink';

export interface AutoNavLinkProps extends BaseNavLinkProps {
  href: string;
}

export const AutoNavLink = forwardRef<any, AutoNavLinkProps>((props, ref) => {
  const csr = useInRouterContext();
  if (csr) {
    const { href, ...rest } = props;
    return <NavLink ref={ref} to={href} {...rest} />;
  }
  return <NextNavLink ref={ref} {...props} />;
});
AutoNavLink.displayName = 'AutoNavLink';
