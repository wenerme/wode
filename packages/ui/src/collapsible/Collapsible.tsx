import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const collapsibleVariants = cva(
	'collapse border-base-300 bg-base-100 data-open:collapse-open data-closed:collapse-close border',
	{
		variants: {
			indicator: {
				none: '',
				arrow: 'collapse-arrow',
				plus: 'collapse-plus',
			},
		},
		defaultVariants: {
			indicator: 'arrow',
		},
	},
);

export type CollapsibleProps = ComponentPropsWithRef<typeof BaseCollapsible.Root> &
	VariantProps<typeof collapsibleVariants>;

export function Collapsible({ className, indicator, ...props }: CollapsibleProps) {
	return (
		<BaseCollapsible.Root
			data-slot='collapsible'
			className={cn(collapsibleVariants({ indicator }), className)}
			{...props}
		/>
	);
}

export type CollapsibleTriggerProps = ComponentPropsWithRef<typeof BaseCollapsible.Trigger>;

export function CollapsibleTrigger({ className, ...props }: CollapsibleTriggerProps) {
	return (
		<BaseCollapsible.Trigger
			data-slot='collapsible-trigger'
			className={cn('collapse-title w-full text-left font-medium outline-none', className)}
			{...props}
		/>
	);
}

export type CollapsibleContentProps = ComponentPropsWithRef<typeof BaseCollapsible.Panel>;

export function CollapsibleContent({ className, ...props }: CollapsibleContentProps) {
	return (
		<BaseCollapsible.Panel data-slot='collapsible-content' className={cn('collapse-content', className)} {...props} />
	);
}

export const CollapsibleCompound = {
	Root: Collapsible,
	Trigger: CollapsibleTrigger,
	Content: CollapsibleContent,
};
