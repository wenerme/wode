'use client';

import {
	type ComponentPropsWithRef,
	Fragment,
	type ReactNode,
	type Ref,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from 'react';
import { cn } from '../../utils';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../resizable';

export type DataViewLayoutRootProps = Omit<ComponentPropsWithRef<'section'>, 'footer'> & {
	footer?: ReactNode;
	header?: ReactNode;
	leftPanel?: ReactNode;
	rightPanel?: ReactNode;
};

export function DataViewLayoutRoot({
	children,
	className,
	footer,
	header,
	leftPanel,
	rightPanel,
	...props
}: DataViewLayoutRootProps) {
	const { ref: forwardedRef, ...restProps } = props;
	const instanceId = useId();
	const rootRef = useRef<HTMLElement | null>(null);
	const desktop = useDataViewDesktop(rootRef);
	const setRootRef = useCallback(
		(element: HTMLElement | null) => {
			rootRef.current = element;
			assignRef(forwardedRef, element);
		},
		[forwardedRef],
	);
	const main = (
		<div className='bg-base-100 flex h-full min-h-0 min-w-0 flex-col' data-slot='data-view-layout-main'>
			<div className='flex min-h-0 min-w-0 flex-1 flex-col'>{children}</div>
			{footer}
		</div>
	);
	return (
		<section
			ref={setRootRef}
			className={cn('bg-base-100 flex h-full min-h-0 min-w-0 flex-col overflow-hidden', className)}
			data-slot='data-view-layout'
			{...restProps}
		>
			{header}
			<ResizablePanelGroup
				id={`${instanceId}-data-view-layout`}
				className='min-h-0 min-w-0 flex-1'
				data-layout={desktop ? 'desktop' : 'mobile'}
				data-slot='data-view-layout-panels'
				orientation={desktop ? 'horizontal' : 'vertical'}
			>
				{leftPanel ? (
					<Fragment key='left-panel'>
						<ResizablePanel
							id={`${instanceId}-left-panel`}
							className='min-w-0'
							defaultSize='18rem'
							maxSize='32rem'
							minSize='14rem'
							style={{ overflow: 'hidden' }}
						>
							{leftPanel}
						</ResizablePanel>
						<ResizableHandle id={`${instanceId}-left-panel-resize`} aria-label='调整左侧面板大小' />
					</Fragment>
				) : null}
				<ResizablePanel
					key='main-panel'
					id={`${instanceId}-main`}
					className='min-w-0'
					minSize='20rem'
					style={{ overflow: 'hidden' }}
				>
					{main}
				</ResizablePanel>
				{rightPanel ? (
					<Fragment key='right-panel'>
						<ResizableHandle id={`${instanceId}-right-panel-resize`} aria-label='调整右侧面板大小' />
						<ResizablePanel
							id={`${instanceId}-right-panel`}
							className='min-w-0'
							defaultSize='22rem'
							maxSize='36rem'
							minSize='16rem'
							style={{ overflow: 'hidden' }}
						>
							{rightPanel}
						</ResizablePanel>
					</Fragment>
				) : null}
			</ResizablePanelGroup>
		</section>
	);
}

export type DataViewLayoutHeaderProps = Omit<ComponentPropsWithRef<'header'>, 'title'> & {
	actions?: ReactNode;
	controls?: ReactNode;
	description?: ReactNode;
	menu?: ReactNode;
	prefix?: ReactNode;
	search?: ReactNode;
	status?: ReactNode;
	title?: ReactNode;
};
export function DataViewLayoutHeader({
	actions,
	className,
	controls,
	description,
	menu,
	prefix,
	search,
	status,
	title,
	...props
}: DataViewLayoutHeaderProps) {
	return (
		<header
			{...props}
			className={cn(
				'border-base-300 bg-base-100 flex min-w-0 flex-wrap items-center gap-2 border-b px-3 py-2',
				className,
			)}
			data-slot='data-view-layout-header'
		>
			{prefix}
			{title ? <div className='min-w-0 shrink-0'>{title}</div> : null}
			{description ? <span className='sr-only'>{description}</span> : null}
			{status}
			{search}
			{controls}
			<div className='min-w-4 flex-1' />
			{actions}
			{menu}
		</header>
	);
}
export type DataViewLayoutBodyProps = ComponentPropsWithRef<'div'>;
export function DataViewLayoutBody({ children, className, ...props }: DataViewLayoutBodyProps) {
	return (
		<div {...props} className={cn('min-h-full min-w-0', className)} data-slot='data-view-layout-body'>
			{children}
		</div>
	);
}
export type DataViewLayoutFooterProps = ComponentPropsWithRef<'footer'> & {
	actions?: ReactNode;
	controls?: ReactNode;
	extraInfos?: ReactNode;
	menu?: ReactNode;
	pageInfo?: ReactNode;
	pageNav?: ReactNode;
	status?: ReactNode;
};
export function DataViewLayoutFooter({
	actions,
	children,
	className,
	controls,
	extraInfos,
	menu,
	pageInfo,
	pageNav,
	status,
	...props
}: DataViewLayoutFooterProps) {
	return (
		<footer
			{...props}
			className={cn(
				'border-base-300 bg-base-100 flex min-h-11 shrink-0 flex-wrap items-center gap-2 border-t px-3 py-1 text-xs',
				className,
			)}
			data-slot='data-view-layout-footer'
		>
			{pageInfo}
			{actions}
			{extraInfos}
			{children}
			<div className='min-w-4 flex-1' />
			{controls}
			{status}
			{pageNav}
			{menu}
		</footer>
	);
}
export const DataViewLayout = {
	Root: DataViewLayoutRoot,
	Header: DataViewLayoutHeader,
	Body: DataViewLayoutBody,
	Footer: DataViewLayoutFooter,
} as const;

function useDataViewDesktop(rootRef: { current: HTMLElement | null }): boolean {
	const [desktop, setDesktop] = useState(false);
	useEffect(() => {
		const root = rootRef.current;
		if (!root || typeof globalThis.ResizeObserver !== 'function') return;
		const update = () => setDesktop(root.getBoundingClientRect().width >= 640);
		update();
		const observer = new ResizeObserver(update);
		observer.observe(root);
		return () => observer.disconnect();
	}, [rootRef]);
	return desktop;
}
function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
	if (typeof ref === 'function') ref(value);
	else if (ref) ref.current = value;
}
