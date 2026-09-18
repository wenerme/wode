'use client';

import { Tabs } from '@base-ui/react/tabs';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ConsoleRecordTab = {
	badge?: ReactNode;
	content: ReactNode;
	disabled?: boolean;
	icon?: ReactNode;
	label: ReactNode;
	value: string;
};

export type ConsoleRecordTabsProps = Omit<
	ComponentPropsWithRef<typeof Tabs.Root>,
	'children' | 'defaultValue' | 'onValueChange' | 'value'
> & {
	defaultValue?: string | null;
	keepMounted?: boolean;
	listLabel?: string;
	onValueChange?: (value: string | null, eventDetails: Tabs.Root.ChangeEventDetails) => void;
	panelClassName?: string;
	tabs: ConsoleRecordTab[];
	value?: string | null;
};

export function ConsoleRecordTabs({
	className,
	defaultValue,
	keepMounted = true,
	listLabel = '记录视图',
	onValueChange,
	panelClassName,
	tabs,
	value,
	...props
}: ConsoleRecordTabsProps) {
	const initialValue = defaultValue === undefined ? tabs.find((tab) => !tab.disabled)?.value : defaultValue;
	const rootClassName =
		typeof className === 'function'
			? (state: Tabs.Root.State) => cn('min-h-0', className(state))
			: cn('min-h-0', className);
	return (
		<Tabs.Root
			className={rootClassName}
			defaultValue={value === undefined ? initialValue : undefined}
			onValueChange={onValueChange}
			value={value}
			{...props}
		>
			<div className='border-base-300 bg-base-100 overflow-x-auto border-b px-4 sm:px-6'>
				<Tabs.List aria-label={listLabel} className='relative flex min-w-max items-stretch gap-1'>
					{tabs.map((tab) => (
						<Tabs.Tab
							key={tab.value}
							value={tab.value}
							disabled={tab.disabled}
							className={cn(
								'text-base-content/70 hover:text-base-content focus-visible:ring-primary relative flex min-h-11 items-center gap-2 px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset',
								'data-[active]:text-base-content after:bg-primary after:absolute after:right-2 after:bottom-0 after:left-2 after:h-0.5 after:scale-x-0 after:transition-transform data-[active]:after:scale-x-100',
								'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
							)}
						>
							{hasRenderableNode(tab.icon) ? <span className='shrink-0'>{tab.icon}</span> : null}
							<span>{tab.label}</span>
							{hasRenderableNode(tab.badge) ? <span className='shrink-0'>{tab.badge}</span> : null}
						</Tabs.Tab>
					))}
				</Tabs.List>
			</div>
			{tabs.map((tab) => (
				<Tabs.Panel
					key={tab.value}
					value={tab.value}
					keepMounted={keepMounted}
					className={cn('outline-none', panelClassName)}
				>
					{tab.content}
				</Tabs.Panel>
			))}
		</Tabs.Root>
	);
}

function hasRenderableNode(value: ReactNode) {
	return value !== undefined && value !== null && value !== false;
}
