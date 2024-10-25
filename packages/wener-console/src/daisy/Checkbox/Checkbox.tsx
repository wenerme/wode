import React, { forwardRef, useEffect, useRef, type HTMLProps } from 'react';
import { mergeRefs } from '@wener/reaction';
import classNames from 'clsx';
import type { DaisyModifierProps } from '../utils/daisy';
import { daisy, omit } from '../utils/daisy';

export type CheckboxProps = HTMLProps<HTMLInputElement> & {
  indeterminate?: boolean;
} & Pick<DaisyModifierProps, 'intent' | 'size'>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ indeterminate, className, ...props }, _ref) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof indeterminate === 'boolean' && ref.current) {
      ref.current.indeterminate = !props.checked && indeterminate;
    }
  }, [ref, indeterminate]);
  return (
    <input
      type='checkbox'
      ref={mergeRefs(ref, _ref)}
      className={classNames('cursor-pointer', daisy('checkbox', props), className)}
      {...omit(props, ['intent', 'size'])}
    />
  );
});
Checkbox.displayName = 'Checkbox';
