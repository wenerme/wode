import { AnchorHTMLAttributes, ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import classNames from 'classnames';
import { daisyProps, IntentType, SizeType } from '../daisy';

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
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className, children, active, disabled, loading, ...props }, ref) => {
    let cs = classNames(
      // input
      // input-primary, input-secondary, input-success, input-danger, input-warning, input-info, input-light, input-dark
      // input-sm, input-lg, input-xs
      active && 'btn-active',
      loading && 'loading',
      disabled && 'btn-disabled',
      className,
    );
    if ('href' in props) {
      return (
        <a role={'button'} ref={ref as any} {...daisyProps('btn', props, { className: cs })}>
          {children}
        </a>
      );
    }
    return (
      <button type={'button'} ref={ref as any} {...daisyProps('btn', props, { className: cs })}>
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
