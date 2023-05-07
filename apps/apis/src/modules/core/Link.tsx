import React, { AnchorHTMLAttributes, ComponentType } from 'react';
import { Link as ReactRouterLink, LinkProps as ReactRouterLinkProps, useInRouterContext } from 'react-router-dom';
import { default as NextLink, LinkProps as NextLinkProps } from 'next/link';

export const Link: React.FC<
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    to?: string;
    use?: string | ComponentType<any>;
  }
> = ({ children, to, use, ...props }) => {
  props.href ||= to;
  if (typeof window !== 'undefined') {
    if (useInRouterContext()) {
      let p = props as ReactRouterLinkProps;
      p.to = to || props.href || '';
      use = ReactRouterLink;
    }
  }
  if (!use) {
    let p = props as NextLinkProps;
    use ||= NextLink;
  }
  use ||= 'a';

  return React.createElement(use, props, children);
};
