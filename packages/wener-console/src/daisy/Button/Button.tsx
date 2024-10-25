import React, { useMemo, useState, type ComponentProps, type ElementType, type ReactNode, type Ref } from 'react';
import { isPromise } from '@wener/utils';
import { clsx } from 'clsx';
import type { IntentType, SizeType } from '../const';
import { daisy, omitDaisyModifiers } from '../utils/daisy';

export type ButtonProps<E extends ElementType> = Omit<ComponentProps<E>, 'as'> & {
  as?: E;
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
};

export const Button = <E extends ElementType>({
  className,
  onClick,
  as,
  children,
  active,
  disabled,
  loading,
  ref,
  ...props
}: ButtonProps<E> & {
  ref?: Ref<HTMLButtonElement | HTMLAnchorElement>;
}) => {
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
        (r as Promise<any>).finally(() => {
          setLoading(false);
        });
      }
      return r;
    };
    // }
    // return onClick;
  }, [onClick]);

  const cs = clsx(
    // input
    // input-primary, input-secondary, input-success, input-danger, input-warning, input-info, input-light, input-dark
    // input-sm, input-lg, input-xs
    // loading loading-sm loading-lg loading-xs
    daisy('btn', props),
    active && 'btn-active',
    (loading || isLoading) && `loading ${daisy('loading', { size: props.size })}`,
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
};
