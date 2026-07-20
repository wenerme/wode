import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@wener/console';
import { HeaderContentFooterLayout } from '@wener/console/components';
import {
	type ComponentProps,
	type ComponentPropsWithRef,
	type CSSProperties,
	type ReactNode,
	useCallback,
	useRef,
} from 'react';
import { Group, Panel, type PanelProps } from 'react-resizable-panels';
import { ActionIcon } from '../icons/ActionIcon';
import { LeftContentRightLayout } from '../LeftContentRightLayout';
import { PanelResizeLineHandle } from '../ResizablePanel';
import { Tabs } from '../Tabs';
import { MeasureSize } from './MeasureSize';

const _rightConfig = {
	defaultSize: '30%',
	minSize: '20%',
	maxSize: '60%',
	collapsible: true,
} as const;
const _leftConfig = {
	defaultSize: '15%',
	minSize: '10%',
	maxSize: '35%',
	collapsible: true,
} as const;

export namespace DataViewLayout {
	type CompositeProps = ComponentPropsWithRef<'div'> & {
		header?: ReactNode;
		footer?: ReactNode;
		children?: ReactNode;
		left?: ReactNode;
		leftPanel?: ReactNode;
		right?: ReactNode;
		rightPanel?: ReactNode;
	};

	export const Composite = ({
		header,
		footer,
		leftPanel,
		children,
		rightPanel,
		left,
		right,
		...props
	}: CompositeProps) => {
		/*
┌─────────────────────────────────────────────────────────┐
│                        Header                           │
├──────────┬─────────────────────────┬────────────────────┤
│          │                         │                    │
│  Left    │       Content           │      Right         │
│  Panel   │       ┌────────┐        │      Panel         │
│          │       │Children│        │                    │
│(optional)│       └────────┘        │   (optional)       │
│          │       ┌────────┐        │                    │
│          │       │ Footer │        │                    │
│          │       └────────┘        │                    │
└──────────┴─────────────────────────┴────────────────────┘
		 */

		const hasLeftPanel = Boolean(left || leftPanel);
		const hasRightPanel = Boolean(right || rightPanel);

		return (
			<HeaderContentFooterLayout header={header} {...props}>
				<Group orientation='horizontal'>
					{hasLeftPanel && (left ?? <LeftPanel>{leftPanel}</LeftPanel>)}

					<Panel id={'content'}>
						<HeaderContentFooterLayout footer={footer}>{children}</HeaderContentFooterLayout>
					</Panel>

					{hasRightPanel && (right ?? <RightPanel>{rightPanel}</RightPanel>)}
				</Group>
			</HeaderContentFooterLayout>
		);
	};

	export const LeftPanel = ({ children }: { children?: ReactNode }) => {
		return (
			<>
				<Panel id='left' className={'relative'} {..._leftConfig}>
					{children}
				</Panel>
				<PanelResizeLineHandle />
			</>
		);
	};
	export const RightPanel = ({ children, ...props }: PanelProps) => {
		return (
			<>
				<PanelResizeLineHandle />
				<Panel id='right' className={'relative'} {..._rightConfig} {...props}>
					{children}
				</Panel>
			</>
		);
	};

	export type HeaderProps = Omit<ComponentPropsWithRef<'header'>, 'title'> & {
		prefix?: ReactNode;
		suffix?: ReactNode;
		title?: ReactNode;
		filter?: ReactNode;
		actions?: ReactNode;
		loading?: boolean;
	};

	export const Header = ({
		loading,
		children,
		className,
		prefix,
		suffix,
		title,
		filter,
		actions,
		...props
	}: HeaderProps) => {
		/*
┌────────────────────────────────────────────────────────┐
│ [prefix] Title [filter]          [actions] [suffix]    │
│                                                        │
│          └── flex-1 spacer ──┘                         │
└────────────────────────────────────────────────────────┘
		 */

		const parts: ReactNode[] = [prefix];

		if (title) {
			parts.push(
				typeof title === 'string' ? (
					<div data-loading={loading || null} className={cn('px-2 font-semibold data-loading:animate-pulse')}>
						{title}
					</div>
				) : (
					title
				),
			);
		}

		parts.push(filter);

		// Actions and suffix typically go to the right
		if (actions || suffix) {
			parts.push(<div className='flex-1' key='spacer' />);
			parts.push(actions, suffix);
		}

		return (
			<header className={cn('bg-base-100 z-30 flex flex-wrap items-center gap-2 border-b p-2', className)} {...props}>
				{parts.filter(Boolean)}
				{children}
			</header>
		);
	};

	export type FooterProps = ComponentPropsWithRef<'div'> & {
		left?: ReactNode;
		right?: ReactNode;
	};

	export const Footer = ({ children, className, ...props }: FooterProps) => {
		/*
┌────────────────────────────────────────────────────────┐
│ [children - flex layout with gap-2]                    │
│                                                         │
│ Typical usage:                                          │
│ <PageInfo /> <PageNav /> <CustomContent />             │
└────────────────────────────────────────────────────────┘
		 */

		return <LeftContentRightLayout className={cn('z-10 px-4 py-2', className)} {...props}></LeftContentRightLayout>;
	};

	type SidebarProps = ComponentPropsWithRef<'aside'> & {
		title?: ReactNode;
		header?: ReactNode;
		footer?: ReactNode;
	};

	export const Sidebar = ({ title, header, footer, children, className, ...props }: SidebarProps) => {
		/*
┌─────────────────────────────┐
│ Title/Header                │  ← header (fixed)
├─────────────────────────────┤
│                             │
│ Children                    │  ← children (scrollable)
│ (scrollable content)        │
│                             │
├─────────────────────────────┤
│ Footer                      │  ← footer (fixed, optional)
└─────────────────────────────┘
		 */

		return (
			<aside className={cn('flex h-full flex-col', className)} {...props}>
				{(title || header) && (
					<div className='bg-base-100 flex-none border-b p-2'>
						{typeof title === 'string' ? <h3 className='font-semibold'>{title}</h3> : title || header}
					</div>
				)}
				<div className='flex-1 overflow-auto p-2'>{children}</div>
				{footer && <div className='bg-base-100 flex-none border-t p-2'>{footer}</div>}
			</aside>
		);
	};

	export type SummaryProps = Omit<ComponentPropsWithRef<'aside'>, 'title'> & {
		title?: ReactNode;
		description?: ReactNode;
		tabs?: Tabs.TabItem[];
		activeTab?: string;
		onTabChange?: (key: string) => void;
		header?: ReactNode;
		footer?: ReactNode;
		children?: ReactNode;
		onClose?: () => void;
	};

	export const Summary = ({
		title,
		description,
		tabs,
		activeTab,
		onTabChange,
		header,
		footer,
		children,
		className,
		onClose,
		...props
	}: SummaryProps) => {
		/*
┌─────────────────────────────┐
│ Title                    [×]│  ← Header (title, description, close button)
│ Description                 │
├─────────────────────────────┤
│ Children Content            │  ← children (fixed, optional, always before tabs)
├─────────────────────────────┤
│ Tab1 | Tab2 | Tab3          │  ← Tabs (optional, uses Tabs.Composite)
├─────────────────────────────┤
│                             │
│ Tab Content                 │  ← Active tab content (scrollable, only if tabs exist)
│ (scrollable)                │
│                             │
├─────────────────────────────┤
│ Footer                      │  ← Footer (fixed, optional)
└─────────────────────────────┘
		 */

		return (
			<aside className={cn('flex h-full flex-col', className)} {...props}>
				{/* Header: Title + Description + Close */}
				{(title || header || onClose) && (
					<div className='bg-base-100 flex-none border-b p-2'>
						<div className='flex items-center gap-2'>
							<div className='flex-1'>
								{typeof title === 'string' ? <h3 className='font-semibold'>{title}</h3> : title || header}
								{description && (
									<div className='text-base-content/60 mt-1 text-sm'>
										{typeof description === 'string' ? <p>{description}</p> : description}
									</div>
								)}
							</div>
							{onClose && (
								<button type='button' className='btn btn-circle btn-ghost btn-xs' onClick={onClose} title='关闭'>
									<ActionIcon.Close />
								</button>
							)}
						</div>
					</div>
				)}

				{children && <div className='bg-base-100 flex-none border-b p-2'>{children}</div>}

				{tabs && tabs.length > 0 && (
					<div className='flex flex-1 flex-col'>
						<Tabs.Composite
							tabs={tabs}
							activeTab={activeTab}
							onTabChange={onTabChange}
							variant='border'
							className='flex-1'
						/>
					</div>
				)}

				{footer && <div className='bg-base-100 flex-none border-t p-2'>{footer}</div>}
			</aside>
		);
	};

	export type ListItemProps = Omit<ComponentPropsWithRef<'div'>, 'title' | 'prefix'> & {
		selected?: boolean;
		onSelectedChange?: (selected: boolean) => void;
		header?: ReactNode;
		title?: ReactNode;
		prefix?: ReactNode;
		suffix?: ReactNode;
		trailing?: ReactNode;
		description?: ReactNode;
		onTitleClick?: () => void;
		actions?: ReactNode;
		meta?: ReactNode;
		children?: ReactNode;
	};

	export const ListItem = ({
		selected,
		onSelectedChange,
		header,
		title,
		prefix,
		suffix,
		trailing,
		description,
		onTitleClick,
		actions,
		meta,
		children,
		className,
		...props
	}: ListItemProps) => {
		/*
┌─────────────────────────────────────────────────────────────┐
│ [✓] [header]
|     title [suffix]                               [trailing] │
│     description                                             │
│     Actions           · Meta: Created by Jane • 1 day ago   │
│     children                                                │
└─────────────────────────────────────────────────────────────┘
	 */

		return (
			<div {...props} className={cn('group/item hover:bg-base-200/30 flex gap-2 border-b p-2', className)}>
				{onSelectedChange && (
					<div className='flex items-start pt-1 opacity-0 group-hover/item:opacity-100'>
						<input
							type='checkbox'
							className='checkbox checkbox-sm'
							checked={selected ?? false}
							onChange={(e) => onSelectedChange?.(e.target.checked)}
						/>
					</div>
				)}

				<div className='flex flex-1 flex-col gap-1'>
					{header}
					{(title || suffix || trailing || prefix) && (
						<div className='flex flex-wrap items-center gap-2'>
							{prefix}
							{title && (
								<div
									className={cn('font-medium', onTitleClick && 'hover:text-primary cursor-pointer')}
									onClick={onTitleClick}
								>
									{title}
								</div>
							)}
							{suffix}
							<div className='flex-1'></div>
							{trailing && <div className='flex items-center'>{trailing}</div>}
						</div>
					)}

					{description}

					{(actions || meta) && (
						<div className='flex items-center gap-2 pt-1'>
							{actions ? <div className='flex gap-1'>{actions}</div> : <div />}
							<div className={'flex-1'}></div>
							{meta && <div className='text-base-content/60 text-xs'>{meta}</div>}
						</div>
					)}

					{children}
				</div>
			</div>
		);
	};

	export type ListProps<T = any> = ComponentPropsWithRef<'div'> & {
		data: T[];
		renderItem: (props: { item: T; index: number; style: CSSProperties }) => ReactNode;
		estimatedItemSize?: number;
		overscan?: number;
		onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
	};

	export const List = <T,>({
		data,
		renderItem,
		estimatedItemSize = 80,
		overscan = 5,
		className,
		onScroll,
		...props
	}: ListProps<T>) => {
		const parentRef = useRef<HTMLDivElement>(null);

		const virtualizer = useVirtualizer({
			count: data.length,
			getScrollElement: () => parentRef.current,
			estimateSize: () => estimatedItemSize,
			overscan,
			// measureElement:
			// 	typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
			// 		? (element) => element.getBoundingClientRect().height
			// 		: undefined,
		});

		return (
			<MeasureSize.Root value={useCallback(() => virtualizer.measure, [virtualizer])}>
				<div ref={parentRef} className={cn('h-full overflow-auto', className)} onScroll={onScroll} {...props}>
					<div
						className='relative w-full'
						style={{
							height: `${virtualizer.getTotalSize()}px`,
						}}
					>
						{virtualizer.getVirtualItems().map((virtualItem) => {
							const item = data[virtualItem.index];
							return (
								<div
									key={virtualItem.key}
									data-index={virtualItem.index}
									ref={virtualizer.measureElement}
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										width: '100%',
										transform: `translateY(${virtualItem.start}px)`,
									}}
								>
									{renderItem({ item, index: virtualItem.index, style: {} })}
								</div>
							);
						})}
					</div>
				</div>
			</MeasureSize.Root>
		);
	};

	export type SummaryTabContentProps = ComponentPropsWithRef<'div'> & {
		header?: ReactNode;
		title?: ReactNode;
		footer?: ReactNode;
		footerActions?: ReactNode;
		footerInfo?: ReactNode;
		children?: ReactNode;
	};

	export const SummaryTab = ({
		header,
		title,
		footer,
		footerActions,
		footerInfo,
		children,
		className,
		...props
	}: SummaryTabContentProps) => {
		/*
┌─────────────────────────────────────────┐
│ header | [title]                        │ ← Header 区域
├─────────────────────────────────────────┤
│                                         │
│           children                      │ ← Content 区域
│                                         │
├─────────────────────────────────────────┤
│ [footer]  actions  flex-1      info     │ ← Footer 区域
└─────────────────────────────────────────┘
 */

		if (!header && !footer && !title && !footerActions && !footerInfo) {
			return (
				<div className={cn('p-4', className)} {...props}>
					{children}
				</div>
			);
		}

		// 构建 footer 内容
		const footerContent =
			footer || footerActions || footerInfo ? (
				<div className='border-t p-4'>
					{footer ? (
						footer
					) : (
						<div className='flex items-center gap-2'>
							{footerActions && <div className='flex gap-1'>{footerActions}</div>}
							<div className='flex-1'></div>
							{footerInfo && <div className='text-base-content/60 text-xs'>{footerInfo}</div>}
						</div>
					)}
				</div>
			) : null;

		return (
			<HeaderContentFooterLayout
				header={
					(header || title) && (
						<div className='flex items-center justify-between border-b p-4'>
							{header}
							{title && <div className='font-semibold'>{title}</div>}
						</div>
					)
				}
				footer={footerContent}
				className={className}
				{...props}
			>
				<div className='p-4'>{children}</div>
			</HeaderContentFooterLayout>
		);
	};
}
