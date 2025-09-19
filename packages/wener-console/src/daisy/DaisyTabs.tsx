import React, { Fragment, type FC, type ReactNode } from 'react';
import { Tabs } from '@base-ui-components/react/tabs';
import { cn } from '@wener/console';
import { Daisy } from '@wener/console/daisy';
import { flexRender, type FlexRenderable } from '@wener/reaction';
import { isNodeTypeOf } from './isNodeTypeOf';

export type DaisyTabsCompositeProps = Omit<DaisyTabsRootProps, 'content' | 'title'> & {
	ref?: React.Ref<HTMLDivElement>;
	list?: ReactNode;
	// content?:ReactNode
	tabs?: Array<{
		label?: ReactNode;
		trigger?: ReactNode;
		key?: string;
		href?: string;
		icon?: FlexRenderable<any>;
		action?: ReactNode;
		content?: ReactNode;
		asChild?: boolean;
	}>;
	renderList?: (props: { children: ReactNode }) => ReactNode;
	renderContent?: (props: { children: ReactNode }) => ReactNode;
} & Pick<DaisyTabsListProps, 'size' | 'variant' | 'title' | 'action'>;

export const DaisyTabsComposite = ({
	children,
	renderContent = (props) => props.children,
	renderList = (props) => props.children,
	tabs = [],
	list,
	size,
	variant,
	title,
	action,
	ref,
	...props
}: DaisyTabsCompositeProps) => {
	if (!list) {
		list = (
			<DaisyTabsList {...{ size, variant, title, action }}>
				{tabs.map((item, index) => {
					const { label, href, icon } = item;
					const key = item.key ?? String(index);
					const Tag = item.href ? 'a' : 'button';
					let trigger: ReactNode;

					if (isNodeTypeOf(item.trigger, [DaisyTabsTrigger, Tabs.Tab])) {
						trigger = item.trigger;
					} else if (item.trigger) {
						trigger = (
							<DaisyTabsTrigger key={key} value={key} asChild>
								{item.trigger}
							</DaisyTabsTrigger>
						);
					} else if (item.href) {
						trigger = (
							<DaisyTabsTrigger key={key} value={key} asChild>
								<Tag href={href}>
									{flexRender(icon, {})}
									{label}
								</Tag>
							</DaisyTabsTrigger>
						);
					} else {
						trigger = (
							<DaisyTabsTrigger key={key} value={key}>
								{flexRender(icon, {})}
								{label}
							</DaisyTabsTrigger>
						);
					}

					return trigger;
				})}
			</DaisyTabsList>
		);
	}
	let hasContent = tabs.some((v) => v.content);
	let content: ReactNode = null;
	if (hasContent) {
		content = (
			<Fragment>
				{tabs.map((item, index) => {
					const key = item.key ?? String(index);
					let c = isNodeTypeOf(item.content, [DaisyTabsPanel, Tabs.Panel]) ? (
						item.content
					) : (
						<DaisyTabsPanel key={index} value={key || String(index)}>
							{item.content}
						</DaisyTabsPanel>
					);
					return c;
				})}
			</Fragment>
		);
	}
	return (
		<DaisyTabsRoot {...props}>
			{renderList({ children: list })}
			{children}
			{renderContent({ children: content })}
		</DaisyTabsRoot>
	);
};

export interface DaisyTabsRootProps extends React.ComponentProps<typeof Tabs.Root> {}

export const DaisyTabsRoot: FC<DaisyTabsRootProps> = ({ className, ...props }) => {
	return <Tabs.Root className={cn('flex flex-col', className)} {...props} />;
};

export interface DaisyTabsPanelProps extends React.ComponentProps<typeof Tabs.Panel> {}

export const DaisyTabsPanel: FC<DaisyTabsPanelProps> = ({ className, ...props }) => {
	return <Tabs.Panel className={cn('data-[state=inactive]:hidden', className)} {...props} />;
};

export interface DaisyTabsListProps extends Omit<React.ComponentProps<typeof Tabs.List>, 'title'> {
	size?: Daisy.SizeType;
	variant?: 'boxed' | 'bordered' | 'lifted';
	action?: React.ReactNode;
	title?: React.ReactNode;
}

export const DaisyTabsList: FC<DaisyTabsListProps> = ({
	className,
	variant,
	size,
	action,
	title,
	children,
	...props
}) => {
	const sz = Daisy.getSize(size);

	return (
		<Tabs.List className={cn('flex', 'data-[variant=boxed]:self-center')} data-variant={variant} {...props}>
			{variant === 'lifted' && (
				<div
					className={'border-color flex h-full items-center self-end px-2'}
					style={{
						// border-b-[--tab-border]  not works
						borderBottomWidth: 'var(--tab-border,1px)',
					}}
				>
					<h3 className={'text-lg font-medium'}>{title}</h3>
				</div>
			)}
			<div
				className={cn(
					'tabs',
					variant === 'boxed' && 'tabs-boxed',
					variant === 'bordered' && 'tabs-bordered',
					variant === 'lifted' && 'tabs-lifted self-start',
					sz?.tabs,
					className,
				)}
			>
				{children}
			</div>
			{variant === 'lifted' && (
				<div
					className={'border-color flex-1 border-b'}
					style={{
						// border-b-[--tab-border]  not works
						borderBottomWidth: 'var(--tab-border,1px)',
					}}
				/>
			)}
			{variant === 'lifted' && action && (
				<div
					className={'border-color flex items-center self-stretch border-b pr-1'}
					style={{
						borderBottomWidth: 'var(--tab-border,1px)',
					}}
				>
					{action}
				</div>
			)}
		</Tabs.List>
	);
};

export interface DaisyTabsTriggerProps extends React.ComponentProps<typeof Tabs.Tab> {}

export const DaisyTabsTrigger: FC<DaisyTabsTriggerProps> = ({ className, ...props }) => {
	return (
		<Tabs.Tab
			className={cn(
				//
				'tab',
				'data-[disabled]:tab-disabled',
				'data-[selected]:tab-active',
				className,
			)}
			{...props}
		/>
	);
};

export const DaisyTabs = {
	Composite: DaisyTabsComposite,
	Root: DaisyTabsRoot,
	List: DaisyTabsList,
	Tab: DaisyTabsTrigger,
	Trigger: DaisyTabsTrigger, // Backward compatibility alias
	Panel: DaisyTabsPanel,
	Content: DaisyTabsPanel, // Backward compatibility alias
} as const;
