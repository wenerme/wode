import type { ReactNode } from 'react';
import { Tabs as BaseTabs } from '@base-ui-components/react/tabs';
import { cn } from '@wener/console';
import { flexRender, type FlexRenderable } from '@wener/reaction';

export namespace Tabs {
	/*
Lifted (with title/action):
┌──────────────────────────────────────────────────────────┐
│ [Title]   Tab1 | Tab2 | Tab3                   [Action]  │
│                (supports wrap)                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Tab Content                                              │
│                                                          │
└──────────────────────────────────────────────────────────┘

Lifted (no title - 4px spacer for smooth edge):
┌──────────────────────────────────────────────────────────┐
│ [4px] Tab1 | Tab2 | Tab3                       [Action]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Tab Content                                              │
│                                                          │
└──────────────────────────────────────────────────────────┘

Basic (without title/action):
┌─────────────────────────────────────────────┐
│ Tab1 | Tab2 | Tab3                          │
├─────────────────────────────────────────────┤
│                                             │
│ Tab Content                                 │
│                                             │
└─────────────────────────────────────────────┘
	 */

	export type TabItem = {
		key?: string;
		label?: ReactNode;
		icon?: FlexRenderable<any>;
		content?: ReactNode;
		disabled?: boolean;
	};

	export type CompositeProps = {
		tabs: TabItem[];
		activeTab?: string;
		onTabChange?: (key: string) => void;
		defaultTab?: string;
		variant?: 'box' | 'border' | 'lift';
		className?: string;
		title?: ReactNode;
		action?: ReactNode;
		scrollable?: boolean;
	};

	type ListProps = Omit<BaseTabs.List.Props, 'title'> & Pick<CompositeProps, 'tabs' | 'variant' | 'title' | 'action'>;
	const List = ({ tabs, variant = 'lift', children, title, action, className, ...props }: ListProps) => {
		const tabsWithKeys = tabs.map((tab, index) => ({
			...tab,
			key: tab.key ?? String(index),
		}));
		return (
			<BaseTabs.List
				className={cn(
					'tabs flex-wrap',
					{
						box: 'tabs-box',
						border: 'tabs-border',
						lift: 'tabs-lift',
					}[variant],
					className,
				)}
				{...props}
			>
				{variant === 'lift' && (title || action) && (
					<div
						className='border-color flex h-full items-center self-end px-2'
						style={{
							borderBottomWidth: 'var(--tab-border,1px)',
							height: 'var(--tab-height)',
						}}
					>
						{title && <h3 className='text-lg font-medium'>{title}</h3>}
					</div>
				)}

				{children}

				{tabsWithKeys.map((tab) => (
					<BaseTabs.Tab
						key={tab.key}
						value={tab.key}
						disabled={tab.disabled}
						className={cn('tab', 'data-[selected]:tab-active', 'data-[disabled]:tab-disabled')}
					>
						{tab.icon && flexRender(tab.icon, {})}
						{tab.label}
					</BaseTabs.Tab>
				))}

				{variant === 'lift' && (title || action) && (
					<div
						className='border-color flex-1 border-b'
						style={{
							borderBottomWidth: 'var(--tab-border,1px)',
						}}
					/>
				)}

				{variant === 'lift' && action && (
					<div
						className='border-color flex items-center self-stretch border-b px-2 pr-1'
						style={{
							borderBottomWidth: 'var(--tab-border,1px)',
							height: 'var(--tab-height)',
						}}
					>
						{action}
					</div>
				)}
			</BaseTabs.List>
		);
	};

	export const Composite = ({
		tabs,
		activeTab,
		onTabChange,
		defaultTab,
		variant,
		className,
		title,
		action,
		scrollable, // fixme this is workaround
	}: CompositeProps) => {
		const tabsWithKeys = tabs.map((tab, index) => ({
			...tab,
			key: tab.key ?? String(index),
		}));

		const firstTab = tabsWithKeys[0]?.key || '';
		const defaultValue = defaultTab || firstTab;

		let content = (
			<>
				{tabsWithKeys.map((tab) => (
					<BaseTabs.Panel
						key={tab.key}
						value={tab.key}
						className={cn('flex-1 overflow-auto data-[hidden]:hidden', scrollable && 'h-full')}
					>
						{tab.content}
					</BaseTabs.Panel>
				))}
			</>
		);

		if (scrollable) {
			content = (
				<main className={'relative flex-1'}>
					<div className={'@container absolute inset-0 overflow-auto'}>{content}</div>
				</main>
			);
		}

		return (
			<BaseTabs.Root
				className={cn('flex flex-col', scrollable && 'h-full', className)}
				value={activeTab}
				onValueChange={(value) => {
					onTabChange?.(value as string);
				}}
				defaultValue={defaultValue}
			>
				<List
					{...{
						tabs,
						variant,
						title,
						action,
					}}
				/>

				{content}
			</BaseTabs.Root>
		);
	};
}
