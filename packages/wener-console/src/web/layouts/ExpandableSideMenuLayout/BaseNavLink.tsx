import type { ComponentType, ReactElement } from 'react';

export type BaseNavLink = ComponentType<BaseNavLinkProps>;

export interface BaseNavLinkProps extends Record<string, any> {
  href: string;
  children: ReactElement | ((o: { isActive: boolean }) => ReactElement);
  className: string | ((o: { isActive: boolean }) => string);
}
