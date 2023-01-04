import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentType, ReactNode } from 'react';
import React, { forwardRef, useMemo, useState } from 'react';
import classNames from 'classnames';
import { isPromise } from '@wener/utils';
import type { IntentType, SizeType } from '../const';
import { daisy, omitDaisyModifiers } from '../daisy';

export type ButtonProps = (
  | ButtonHTMLAttributes<HTMLButtonElement>
  | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'type'>)
) & {
  // 是否为激活状态
  active?: boolean;
  loading?: boolean;
  disabled?: boolean;
  outline?: boolean;
  ghost?: boolean;
  square?: boolean;
  circle?: boolean;
  block?: boolean;
  intent?: IntentType;
  size?: SizeType;
  children?: ReactNode;
  as?: ComponentType<any>;
  [k: string]: any; // fixme type based on as
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className, onClick, as, children, active, disabled, loading, ...props }, ref) => {
    const [isLoading, setLoading] = useState(false);
    const handleClick = useMemo(() => {
      if (!onClick) {
        return undefined;
      }
      setLoading(false);
      // if (onClick?.constructor.name === 'AsyncFunction') {
      const raw: Function = onClick;
      return (...args: any[]) => {
        const r = raw(...args);
        if (isPromise(r)) {
          setLoading(true);
          r.finally(() => setLoading(false));
        }
        return r;
      };
      // }
      // return onClick;
    }, [onClick]);

    const cs = classNames(
      // input
      // input-primary, input-secondary, input-success, input-danger, input-warning, input-info, input-light, input-dark
      // input-sm, input-lg, input-xs
      daisy('btn', props),
      active && 'btn-active',
      (loading || isLoading) && 'loading',
      disabled && 'btn-disabled',
      className,
    );
    // 有 href 且 disabled 为 false 时，使用 a 标签
    const As: any = as || ('href' in props && !(props as any).disabled ? 'a' : 'button');
    return (
      <As className={cs} role={'button'} ref={ref as any} onClick={handleClick} {...omitDaisyModifiers(props)}>
        {children}
      </As>
    );
  },
);

Button.displayName = 'Button';
