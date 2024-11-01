import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@wener/console';
import { isDefined, maybeFunction, parseBoolean, type MaybeFunction } from '@wener/utils';

export type ActiveProps = {
  active?: boolean;
  style?: MaybeFunction<CSSProperties, [{ active: boolean }]>;
  children?: MaybeFunction<ReactNode, [{ active: boolean }]>;
  className?: MaybeFunction<string, [{ active: boolean }]>;
  inactiveClassName?: string;
  activeClassName?: string;
  pass?: { active?: boolean; activeClassName?: boolean; inactiveClassName: boolean };
};

export function resolveActiveProps<P extends ActiveProps>({
  active,
  children,
  className,
  inactiveClassName,
  activeClassName,
  style,
  pass,
  ...props
}: P): {
  className: string;
  children: ReactNode;
  style?: CSSProperties;
  active: boolean;
  props: Omit<P, keyof ActiveProps>;
} {
  if (!isDefined(active)) {
    active = parseBoolean((props as any)['data-active']);
  }
  if (!isDefined(active) && typeof className === 'string') {
    active = className.includes('active');
  }
  className = maybeFunction(className, { active });
  if (active) {
    className = cn(className, activeClassName ?? 'active');
  } else {
    className = cn(className, inactiveClassName ?? 'inactive');
  }
  const p: Record<string, any> = pass
    ? {
        activeClassName,
        inactiveClassName,
        active,
      }
    : {};
  if (pass) {
    for (const [k] of Object.entries(p)) {
      if (!(pass as Record<string, boolean>)[k]) {
        delete p[k];
      }
    }
  }
  children = maybeFunction(children, { active });
  style = maybeFunction(style, { active });
  return {
    className,
    children,
    style,
    active,
    props: {
      ...props,
      ...p,
    },
  };
}
