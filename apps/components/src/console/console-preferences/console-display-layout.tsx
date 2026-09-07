import { Palette } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Children } from 'react';
import { cn } from '@/lib/utils';

export type ConsoleDisplaySettingsHeadingLevel = 2 | 3 | 4 | 5 | 6;

export const headingTag: Record<ConsoleDisplaySettingsHeadingLevel, `h${ConsoleDisplaySettingsHeadingLevel}`> = {
	2: 'h2',
	3: 'h3',
	4: 'h4',
	5: 'h5',
	6: 'h6',
};

export function hasRenderableNode(value: ReactNode) {
	return Children.toArray(value).length > 0;
}

export type ConsoleDisplaySettingsLayoutProps = ComponentPropsWithRef<'div'> & {
	preview?: ReactNode;
	contentClassName?: string;
	previewClassName?: string;
};

export function ConsoleDisplaySettingsLayout({
	preview,
	contentClassName,
	previewClassName,
	children,
	className,
	...props
}: ConsoleDisplaySettingsLayoutProps) {
	return (
		<div
			data-console-density=''
			className={cn(
				'border-base-300 bg-base-100 grid min-w-0 overflow-hidden border xl:grid-cols-[minmax(0,1fr)_23rem]',
				className,
			)}
			{...props}
		>
			<div className={cn('min-w-0 p-4 md:p-5', contentClassName)}>{children}</div>
			{hasRenderableNode(preview) ? (
				<aside
					aria-label='显示设置预览'
					className={cn(
						'border-base-300 bg-base-200/45 hidden border-t p-4 xl:block xl:border-t-0 xl:border-l',
						previewClassName,
					)}
				>
					<div className='sticky top-4'>{preview}</div>
				</aside>
			) : null}
		</div>
	);
}

export type ConsoleDisplaySettingsHeaderProps = Omit<ComponentPropsWithRef<'header'>, 'title'> & {
	title?: string;
	description?: ReactNode;
	actions?: ReactNode;
	headingLevel?: ConsoleDisplaySettingsHeadingLevel;
};

export function ConsoleDisplaySettingsHeader({
	title = '显示设置',
	description,
	actions,
	headingLevel = 2,
	className,
	...props
}: ConsoleDisplaySettingsHeaderProps) {
	const Heading = headingTag[headingLevel];
	return (
		<header
			className={cn('border-base-300 flex items-start justify-between gap-3 border-b pb-4', className)}
			{...props}
		>
			<div className='min-w-0'>
				{title ? (
					<Heading className='flex items-center gap-2 text-sm font-semibold'>
						<Palette className='text-primary size-4 shrink-0' />
						{title}
					</Heading>
				) : null}
				{hasRenderableNode(description) ? (
					<div className='text-base-content/65 mt-1 text-xs leading-5'>{description}</div>
				) : null}
			</div>
			{hasRenderableNode(actions) ? <div className='flex shrink-0 flex-wrap items-center gap-1'>{actions}</div> : null}
		</header>
	);
}
