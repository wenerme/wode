import { X } from 'lucide-react';
import { useId, type ComponentPropsWithRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type DataViewSummaryTab<Value extends string = string> = {
	value: Value;
	label: ReactNode;
	badge?: ReactNode;
	disabled?: boolean;
};

export type DataViewSummaryProps<Value extends string = string> = Omit<ComponentPropsWithRef<'aside'>, 'title'> & {
	title?: ReactNode;
	status?: ReactNode;
	actions?: ReactNode;
	description?: ReactNode;
	tabs?: readonly DataViewSummaryTab<Value>[];
	value?: Value;
	onValueChange?: (value: Value) => void;
	onClose?: () => void;
	closeLabel?: string;
	footerInfo?: ReactNode;
	footerActions?: ReactNode;
	footer?: ReactNode;
	contentClassName?: string;
	headingLevel?: 2 | 3 | 4 | 5 | 6;
};

export function DataViewSummary<Value extends string = string>({
	title,
	status,
	actions,
	description,
	tabs,
	value,
	onValueChange,
	onClose,
	closeLabel = '关闭概要',
	footerInfo,
	footerActions,
	footer,
	contentClassName,
	headingLevel = 2,
	children,
	className,
	'aria-label': ariaLabel,
	...props
}: DataViewSummaryProps<Value>) {
	const Heading = `h${headingLevel}` as const;
	const tabsId = useId();
	const enabledTabIndexes = tabs?.map((tab, index) => (tab.disabled ? -1 : index)).filter((index) => index >= 0) ?? [];
	const requestedTabIndex = tabs?.findIndex((tab) => tab.value === value && !tab.disabled) ?? -1;
	const selectedTabIndex = requestedTabIndex >= 0 ? requestedTabIndex : (enabledTabIndexes[0] ?? -1);
	const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
		if (!tabs?.length) return;
		if (!enabledTabIndexes.length) return;
		const position = enabledTabIndexes.indexOf(index);
		const nextIndex =
			event.key === 'ArrowRight'
				? enabledTabIndexes[(position + 1) % enabledTabIndexes.length]
				: event.key === 'ArrowLeft'
					? enabledTabIndexes[(position - 1 + enabledTabIndexes.length) % enabledTabIndexes.length]
					: event.key === 'Home'
						? enabledTabIndexes[0]
						: event.key === 'End'
							? enabledTabIndexes.at(-1)
							: undefined;
		if (nextIndex === undefined) return;
		event.preventDefault();
		onValueChange?.((tabs[nextIndex] as DataViewSummaryTab<Value>).value);
		event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
	};
	return (
		<aside
			aria-label={ariaLabel ?? '概要'}
			data-slot='data-view-summary'
			className={cn('bg-base-100 flex h-full min-h-0 min-w-0 flex-col', className)}
			{...props}
		>
			<div className='border-base-300 flex h-[57px] min-h-[57px] items-center gap-2 border-b px-3'>
				{title ? (
					<Heading className='min-w-0 flex-1 truncate text-sm font-semibold'>{title}</Heading>
				) : (
					<div className='flex-1' />
				)}
				{status}
				{actions ? <div className='flex shrink-0 items-center gap-1'>{actions}</div> : null}
				{onClose ? (
					<button
						type='button'
						data-data-view-summary-close=''
						aria-label={closeLabel}
						title={closeLabel}
						className='hover:bg-base-200 focus-visible:ring-primary grid size-8 shrink-0 place-items-center rounded-sm outline-none focus-visible:ring-2'
						onClick={onClose}
					>
						<X className='size-4' />
					</button>
				) : null}
			</div>
			{description ? (
				<div className='text-base-content/65 border-base-300 border-b px-3 py-2 text-xs leading-5'>{description}</div>
			) : null}
			{tabs?.length ? (
				<div
					role='tablist'
					aria-label='概要视图'
					aria-orientation='horizontal'
					className='border-base-300 flex h-10 min-h-10 items-end gap-1 overflow-x-auto border-b px-2'
				>
					{tabs.map((tab, index) => {
						const selected = selectedTabIndex === index;
						return (
							<button
								key={tab.value}
								type='button'
								role='tab'
								id={`${tabsId}-tab-${index}`}
								aria-controls={`${tabsId}-panel`}
								aria-selected={selected}
								tabIndex={selected ? 0 : -1}
								disabled={tab.disabled}
								className={cn(
									'border-primary flex h-9 shrink-0 items-center gap-1.5 border-b-2 px-2 text-xs outline-none',
									selected ? 'text-base-content' : 'text-base-content/55 hover:text-base-content border-transparent',
								)}
								onClick={() => onValueChange?.(tab.value)}
								onKeyDown={(event) => handleTabKeyDown(event, index)}
							>
								{tab.label}
								{tab.badge}
							</button>
						);
					})}
				</div>
			) : null}
			<div
				data-slot='data-view-summary-content'
				role={tabs?.length ? 'tabpanel' : undefined}
				id={tabs?.length ? `${tabsId}-panel` : undefined}
				aria-labelledby={selectedTabIndex >= 0 ? `${tabsId}-tab-${selectedTabIndex}` : undefined}
				className={cn('min-h-0 flex-1 overflow-auto p-3', contentClassName)}
			>
				{children}
			</div>
			{footer ??
				(footerInfo || footerActions ? (
					<div className='border-base-300 flex min-h-11 shrink-0 items-center gap-2 border-t px-3 text-xs'>
						{footerInfo ? <div className='text-base-content/65'>{footerInfo}</div> : null}
						<div className='flex-1' />
						{footerActions ? <div className='flex items-center gap-1'>{footerActions}</div> : null}
					</div>
				) : null)}
		</aside>
	);
}
