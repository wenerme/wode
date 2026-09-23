import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../utils';

const linkVariants = cva('link', {
	variants: {
		tone: {
			neutral: 'link-neutral',
			primary: 'link-primary',
			secondary: 'link-secondary',
			accent: 'link-accent',
			info: 'link-info',
			success: 'link-success',
			warning: 'link-warning',
			error: 'link-error',
		},
	},
	defaultVariants: { tone: 'primary' },
});

export type LinkProps = ComponentPropsWithRef<'a'> & VariantProps<typeof linkVariants>;

export function Link({ className, tone, ...props }: LinkProps) {
	return <a data-slot='link' className={cn(linkVariants({ tone }), className)} {...props} />;
}
