import type { ComponentPropsWithRef } from 'react';
import classNames from 'clsx';
import type { DaisyModifierProps } from '../utils/daisy';
import { daisy, omitDaisyModifiers } from '../utils/daisy';

export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'size'> &
	Pick<DaisyModifierProps, 'bordered' | 'ghost' | 'intent' | 'size'>;
export const Input = ({ className, ref, ...props }: InputProps) => {
	const cs = classNames(
		// input
		// input-primary, input-secondary, input-success, input-danger, input-warning, input-info, input-light, input-dark
		// input-sm, input-lg, input-xs
		daisy('input', props),
		className,
	);
	return <input className={cs} {...omitDaisyModifiers(props)} ref={ref} />;
};
Input.displayName = 'Input';
