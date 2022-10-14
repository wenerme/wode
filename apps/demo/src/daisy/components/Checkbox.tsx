import React, { forwardRef, HTMLProps } from 'react';
import { mergeRefs } from '@wener/reaction';
import { DaisyModifierProps, daisyProps } from '../daisy';

export type CheckboxProps = HTMLProps<HTMLInputElement> & {
  indeterminate?: boolean;
} & Pick<DaisyModifierProps, 'intent' | 'size'>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ indeterminate, ...props }, _ref) => {
  const ref = React.useRef<HTMLInputElement>(null!);

  React.useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !props.checked && indeterminate;
    }
  }, [ref, indeterminate]);

  return (
    <input
      type="checkbox"
      ref={mergeRefs(ref, _ref)}
      {...daisyProps('checkbox', props, { className: 'cursor-pointer' })}
    />
  );
});
Checkbox.displayName = 'Checkbox';
