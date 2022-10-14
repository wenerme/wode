import { forwardRef, HTMLProps } from 'react';
import { DaisyModifierProps, daisyProps } from '../daisy';

export type InputProps = Omit<HTMLProps<HTMLInputElement>, 'size'> &
  Pick<DaisyModifierProps, 'bordered' | 'ghost' | 'intent' | 'size'>;
export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return <input {...daisyProps('input', props)} ref={ref} />;
});
Input.displayName = 'Input';
