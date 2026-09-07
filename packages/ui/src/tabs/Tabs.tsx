import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const TabsRoot = BaseTabs.Root;

export const tabsListVariants = cva('tabs', {
	variants: {
		variant: {
			default: '',
			box: 'tabs-box',
			border: 'tabs-border',
			lift: 'tabs-lift',
		},
		placement: {
			top: 'tabs-top',
			bottom: 'tabs-bottom',
		},
	},
	defaultVariants: {
		variant: 'default',
		placement: 'top',
	},
});

export type TabsListProps = ComponentPropsWithRef<typeof BaseTabs.List> & VariantProps<typeof tabsListVariants>;

export function TabsList({ className, variant, placement, ...props }: TabsListProps) {
	return (
		<BaseTabs.List
			data-slot='tabs-list'
			className={cn(tabsListVariants({ variant, placement }), className)}
			{...props}
		/>
	);
}

export type TabsTriggerProps = ComponentPropsWithRef<typeof BaseTabs.Tab>;

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
	return (
		<BaseTabs.Tab
			data-slot='tabs-trigger'
			className={cn('tab data-active:tab-active data-disabled:tab-disabled', className)}
			{...props}
		/>
	);
}

export type TabsContentProps = ComponentPropsWithRef<typeof BaseTabs.Panel>;

export function TabsContent({ className, ...props }: TabsContentProps) {
	return <BaseTabs.Panel data-slot='tabs-content' className={cn('outline-none', className)} {...props} />;
}

export const TabsIndicator = BaseTabs.Indicator;

export const Tabs = {
	Root: TabsRoot,
	List: TabsList,
	Trigger: TabsTrigger,
	Content: TabsContent,
	Indicator: TabsIndicator,
};
