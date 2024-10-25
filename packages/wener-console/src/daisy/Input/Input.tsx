import React, { forwardRef, type HTMLProps } from 'react';
import classNames from 'clsx';
import type { DaisyModifierProps } from '../utils/daisy';
import { daisy, omitDaisyModifiers } from '../utils/daisy';

export type InputProps = Omit<HTMLProps<HTMLInputElement>, 'size'> &
  Pick<DaisyModifierProps, 'bordered' | 'ghost' | 'intent' | 'size'>;
export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  const cs = classNames(
    // input
    // input-primary, input-secondary, input-success, input-danger, input-warning, input-info, input-light, input-dark
    // input-sm, input-lg, input-xs
    daisy('input', props),
    className,
  );
  return <input className={cs} {...omitDaisyModifiers(props)} ref={ref} />;
});
Input.displayName = 'Input';
