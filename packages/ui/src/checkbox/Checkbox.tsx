import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const checkboxVariants = cva('checkbox', {
	variants: {
		tone: {
			default: '',
			neutral: 'checkbox-neutral',
			primary: 'checkbox-primary',
			secondary: 'checkbox-secondary',
			accent: 'checkbox-accent',
			info: 'checkbox-info',
			success: 'checkbox-success',
			warning: 'checkbox-warning',
			error: 'checkbox-error',
		},
		size: {
			xs: 'checkbox-xs size-4',
			sm: 'checkbox-sm size-5',
			md: 'checkbox-md size-6',
			lg: 'checkbox-lg size-7',
			xl: 'checkbox-xl size-8',
		},
	},
	defaultVariants: {
		tone: 'primary',
		size: 'md',
	},
});

export type CheckboxProps = ComponentPropsWithRef<typeof BaseCheckbox.Root> & VariantProps<typeof checkboxVariants>;

export function Checkbox({ className, tone, size, ...props }: CheckboxProps) {
	return (
		<BaseCheckbox.Root data-slot='checkbox' className={cn(checkboxVariants({ tone, size }), className)} {...props} />
	);
}

export const CheckboxIndicator = BaseCheckbox.Indicator;

export const CheckboxCompound = {
	Root: Checkbox,
	Indicator: CheckboxIndicator,
};
