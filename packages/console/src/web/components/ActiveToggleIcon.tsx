import React, { ComponentPropsWithoutRef } from 'react';
import { flexRender, FlexRenderable } from '@wener/reaction';
import { isDefined, parseBoolean } from '@wener/utils';
import { cn } from '../../tw/cn';

export type ActiveToggleIconProps = Omit<ComponentPropsWithoutRef<'div'>, 'className'> & {
  icon?: FlexRenderable<any>;
  iconActive?: FlexRenderable<any>;
  active?: boolean;
  className?: string;
  inactiveClassName?: string;
  activeClassName?: string;
  pass?: { active?: boolean; activeClassName?: boolean; inactiveClassName: boolean };
};

export const ActiveToggleIcon: React.FC<ActiveToggleIconProps> = ({
  icon,
  pass,
  activeClassName,
  inactiveClassName,
  iconActive = icon,
  className,
  active,
  ...props
}) => {
  if (!isDefined(active)) {
    active = parseBoolean((props as any)['data-active']) ?? className?.includes('active');
  }
  if (active) {
    className = cn(className, activeClassName ?? 'active');
  } else {
    className = cn(className, inactiveClassName ?? 'inactive');
  }
  let p: Record<string, any> = pass
    ? {
        activeClassName,
        inactiveClassName,
        active,
      }
    : {};
  if (pass) {
    for (let [k] of Object.entries(p)) {
      if (!(pass as Record<string, boolean>)[k]) {
        delete p[k];
      }
    }
  }
  return flexRender(active ? iconActive : icon, {
    ...props,
    ...p,
    className,
  });
};
