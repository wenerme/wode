import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const switchVariants = cva('toggle', {
	variants: {
		tone: {
			default: '',
			neutral: 'toggle-neutral',
			primary: 'toggle-primary',
			secondary: 'toggle-secondary',
			accent: 'toggle-accent',
			info: 'toggle-info',
			success: 'toggle-success',
			warning: 'toggle-warning',
			error: 'toggle-error',
		},
		size: {
			xs: 'toggle-xs h-4 w-6',
			sm: 'toggle-sm h-5 w-8',
			md: 'toggle-md h-6 w-10',
			lg: 'toggle-lg h-7 w-12',
			xl: 'toggle-xl h-8 w-14',
		},
	},
	defaultVariants: {
		tone: 'primary',
		size: 'md',
	},
});

export type SwitchProps = ComponentPropsWithRef<typeof BaseSwitch.Root> & VariantProps<typeof switchVariants>;

export function Switch({ className, tone, size, ...props }: SwitchProps) {
	return <BaseSwitch.Root data-slot='switch' className={cn(switchVariants({ tone, size }), className)} {...props} />;
}

export const SwitchThumb = BaseSwitch.Thumb;

export const SwitchCompound = {
	Root: Switch,
	Thumb: SwitchThumb,
};
