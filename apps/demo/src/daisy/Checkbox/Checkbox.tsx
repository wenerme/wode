import type { HTMLProps } from 'react';
import React, { forwardRef } from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import { mergeRefs } from '@wener/reaction';
import type { DaisyModifierProps } from '../daisy';
import { daisy, DaisyModifiers } from '../daisy';

export type CheckboxProps = HTMLProps<HTMLInputElement> & {
  indeterminate?: boolean;
} & Pick<DaisyModifierProps, 'intent' | 'size'>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ indeterminate, className, ...props }, _ref) => {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (typeof indeterminate === 'boolean' && ref.current) {
      ref.current.indeterminate = !props.checked && indeterminate;
    }
  }, [ref, indeterminate]);
  return (
    <input
      type="checkbox"
      ref={mergeRefs(ref, _ref)}
      className={classNames('cursor-pointer', daisy('checkbox', props), className)}
      {..._.omit(props, ['intent', 'size'])}
    />
  );
});
Checkbox.displayName = 'Checkbox';
