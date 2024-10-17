import { forwardRef, type ComponentPropsWithRef, type ElementType, type FC } from 'react';
import { Link as _Link, useInRouterContext } from 'react-router-dom';

export type LinkProps<E extends ElementType = 'a'> = Omit<ComponentPropsWithRef<E>, 'href'> & {
  as?: E;
  href: string;
};

export const Link: FC<LinkProps> = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  if (useInRouterContext()) {
    return <_Link to={props.href} {...props} />;
  }
  // if (useIsNextJS()) {
  //   return <NextLink {...props} />;
  // }
  return <a {...props} ref={ref} />;
}) as <E extends ElementType = 'a'>(props: LinkProps<E>) => JSX.Element;
