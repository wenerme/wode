import React, { type ElementType } from 'react';
import { Link as _Link, useInRouterContext } from 'react-router';
import type { AsProps } from './props';

export type LinkProps<E extends ElementType = 'a'> = AsProps<E> & {
	as?: E;
	href: string;
};

export const Link = <E extends ElementType = 'a'>({ as: As = 'a', ...props }: LinkProps<E>) => {
	if (useInRouterContext()) {
		return <_Link to={props.href} {...props} />;
	}
	// if (useIsNextJS()) {
	//   return <NextLink {...props} />;
	// }
	return <As {...props} />;
};
