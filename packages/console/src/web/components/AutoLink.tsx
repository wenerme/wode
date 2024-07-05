import React, { ComponentPropsWithoutRef } from 'react';
import { Link, useInRouterContext } from 'react-router-dom';
import NextLink from 'next/link';
import { useIsNextJS } from '@/web/hooks';

export const AutoLink: React.FC<
  {
    href: string;
  } & Omit<ComponentPropsWithoutRef<'a'>, 'href'>
> = (props) => {
  if (useInRouterContext()) {
    return <Link to={props.href} {...props} />;
  }
  if (useIsNextJS()) {
    return <NextLink {...props} />;
  }
  return <a {...props} />;
};
