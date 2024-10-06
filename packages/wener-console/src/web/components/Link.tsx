import type React from 'react';
import { forwardRef, type ComponentPropsWithRef } from 'react';
import { Link as _Link, useInRouterContext } from 'react-router-dom';

// import NextLink from 'next/link';

export type LinkProps<E extends React.ElementType = 'a'> = Omit<ComponentPropsWithRef<E>, 'href'> & {
  as?: E;
  href: string;
};

export const Link: React.FC<LinkProps> = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  if (useInRouterContext()) {
    return <_Link to={props.href} {...props} />;
  }
  // if (useIsNextJS()) {
  //   return <NextLink {...props} />;
  // }
  return <a {...props} ref={ref} />;
}) as <E extends React.ElementType = 'a'>(props: LinkProps<E>) => JSX.Element;
