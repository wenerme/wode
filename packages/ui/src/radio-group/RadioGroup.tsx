import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export type RadioGroupProps = ComponentPropsWithRef<typeof BaseRadioGroup>;

export function RadioGroup({ className, ...props }: RadioGroupProps) {
	return <BaseRadioGroup data-slot='radio-group' className={cn('grid gap-2', className)} {...props} />;
}

export const radioGroupItemVariants = cva('radio', {
	variants: {
		tone: {
			default: '',
			neutral: 'radio-neutral',
			primary: 'radio-primary',
			secondary: 'radio-secondary',
			accent: 'radio-accent',
			info: 'radio-info',
			success: 'radio-success',
			warning: 'radio-warning',
			error: 'radio-error',
		},
		size: {
			xs: 'radio-xs size-4',
			sm: 'radio-sm size-5',
			md: 'radio-md size-6',
			lg: 'radio-lg size-7',
			xl: 'radio-xl size-8',
		},
	},
	defaultVariants: {
		tone: 'primary',
		size: 'md',
	},
});

export type RadioGroupItemProps = ComponentPropsWithRef<typeof BaseRadio.Root> &
	VariantProps<typeof radioGroupItemVariants>;

export function RadioGroupItem({ className, tone, size, ...props }: RadioGroupItemProps) {
	return (
		<BaseRadio.Root
			data-slot='radio-group-item'
			className={cn(radioGroupItemVariants({ tone, size }), className)}
			{...props}
		/>
	);
}

export const RadioGroupIndicator = BaseRadio.Indicator;

export const RadioGroupCompound = {
	Root: RadioGroup,
	Item: RadioGroupItem,
	Indicator: RadioGroupIndicator,
};
