import { Menu as BaseMenu } from '@base-ui/react/menu';
import { ArrowUpDown, Check, Columns3, ListFilter, MoreHorizontal } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type DataViewSortOption<Value extends string = string> = {
	value: Value;
	label: string;
	disabled?: boolean;
};

export type DataViewSortProps<Value extends string = string> = Omit<
	ComponentPropsWithRef<'select'>,
	'value' | 'onChange'
> & {
	value: Value;
	options: readonly DataViewSortOption<Value>[];
	onValueChange: (value: Value) => void;
	label?: string;
	containerClassName?: string;
};

export function DataViewSort<Value extends string = string>({
	value,
	options,
	onValueChange,
	label = '排序',
	containerClassName,
	className,
	...props
}: DataViewSortProps<Value>) {
	return (
		<label
			className={cn(
				'border-base-300 bg-base-100 flex h-[var(--console-control-height)] shrink-0 items-center gap-1.5 rounded-md border px-2',
				containerClassName,
			)}
		>
			<ArrowUpDown aria-hidden='true' className='text-base-content/45 size-3.5' />
			<span className='sr-only'>{label}</span>
			<select
				aria-label={label}
				value={value}
				className={cn('bg-transparent text-xs outline-none', className)}
				onChange={(event) => onValueChange(event.target.value as Value)}
				{...props}
			>
				{options.map((option) => (
					<option key={option.value} value={option.value} disabled={option.disabled}>
						{option.label}
					</option>
				))}
			</select>
		</label>
	);
}

export type DataViewFilterProps = ComponentPropsWithRef<'button'> & {
	activeCount?: number;
	label?: string;
};

export function DataViewFilter({
	activeCount = 0,
	label = '筛选',
	className,
	children,
	...props
}: DataViewFilterProps) {
	return (
		<button
			type='button'
			aria-label={label}
			aria-pressed={activeCount > 0}
			className={cn(
				'border-base-300 bg-base-100 hover:bg-base-200 flex h-[var(--console-control-height)] shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs',
				activeCount > 0 && 'border-primary/45 bg-primary/8',
				className,
			)}
			{...props}
		>
			<ListFilter aria-hidden='true' className='size-3.5' />
			{children ?? label}
			{activeCount > 0 ? (
				<span className='bg-neutral text-neutral-content rounded px-1 text-[10px]'>{activeCount}</span>
			) : null}
		</button>
	);
}

export type DataViewViewOption<Value extends string = string> = {
	value: Value;
	label: string;
	icon?: ReactNode;
	disabled?: boolean;
};

export type DataViewViewSwitcherProps<Value extends string = string> = Omit<
	ComponentPropsWithRef<'div'>,
	'onChange'
> & {
	value: Value;
	options: readonly DataViewViewOption<Value>[];
	onValueChange: (value: Value) => void;
	label?: string;
};

export function DataViewViewSwitcher<Value extends string = string>({
	value,
	options,
	onValueChange,
	label = '视图',
	className,
	...props
}: DataViewViewSwitcherProps<Value>) {
	return (
		<div
			role='group'
			aria-label={label}
			className={cn(
				'border-base-300 bg-base-100 flex h-[var(--console-control-height)] shrink-0 items-center rounded-md border p-0.5',
				className,
			)}
			{...props}
		>
			{options.map((option) => (
				<button
					key={option.value}
					type='button'
					aria-label={option.label}
					title={option.label}
					aria-pressed={value === option.value}
					disabled={option.disabled}
					className={cn(
						'grid size-7 place-items-center rounded-sm text-xs outline-none disabled:opacity-35',
						value === option.value ? 'bg-neutral text-neutral-content' : 'hover:bg-base-200 text-base-content/60',
					)}
					onClick={() => onValueChange(option.value)}
				>
					{option.icon ?? option.label}
				</button>
			))}
		</div>
	);
}

export type DataViewColumnControlOption<Id extends string = string> = {
	id: Id;
	label: string;
	hideable?: boolean;
};

export type DataViewColumnControlProps<Id extends string = string> = {
	columns: readonly DataViewColumnControlOption<Id>[];
	visibleColumnIds: readonly Id[];
	onVisibleColumnIdsChange: (ids: Id[]) => void;
	label?: string;
	disabled?: boolean;
};

export function getNextVisibleColumnIds<Id extends string>(
	columns: readonly DataViewColumnControlOption<Id>[],
	visibleColumnIds: readonly Id[],
	id: Id,
	checked: boolean,
) {
	const next = new Set(visibleColumnIds);
	if (checked) next.add(id);
	else next.delete(id);
	for (const column of columns) if (column.hideable === false) next.add(column.id);
	if (next.size === 0)
		return columns.filter((column) => visibleColumnIds.includes(column.id)).map((column) => column.id);
	return columns.filter((column) => next.has(column.id)).map((column) => column.id);
}

export function DataViewColumnControl<Id extends string = string>({
	columns,
	visibleColumnIds,
	onVisibleColumnIdsChange,
	label = '显示列',
	disabled,
}: DataViewColumnControlProps<Id>) {
	const visible = new Set(visibleColumnIds);
	const setColumnVisible = (id: Id, checked: boolean) => {
		onVisibleColumnIdsChange(getNextVisibleColumnIds(columns, visibleColumnIds, id, checked));
	};
	return (
		<BaseMenu.Root>
			<BaseMenu.Trigger
				aria-label={label}
				title={label}
				disabled={disabled}
				className='border-base-300 bg-base-100 hover:bg-base-200 grid size-[var(--console-control-height)] shrink-0 place-items-center rounded-md border outline-none'
			>
				<Columns3 aria-hidden='true' className='size-4' />
			</BaseMenu.Trigger>
			<BaseMenu.Portal>
				<BaseMenu.Positioner align='end' side='bottom' sideOffset={4} className='z-60 outline-none'>
					<BaseMenu.Popup className='border-base-300 bg-base-100 text-base-content min-w-44 rounded-md border p-1 shadow-xl outline-none'>
						<BaseMenu.Group>
							<BaseMenu.GroupLabel className='text-base-content/50 px-2 py-1.5 text-[11px] font-medium'>
								{label}
							</BaseMenu.GroupLabel>
							{columns.map((column) => {
								const checked = visible.has(column.id);
								return (
									<BaseMenu.CheckboxItem
										key={column.id}
										checked={checked}
										disabled={column.hideable === false}
										closeOnClick={false}
										className='data-[highlighted]:bg-base-200 flex h-8 cursor-default items-center gap-2 rounded-sm px-2 text-xs outline-none data-[disabled]:opacity-45'
										onCheckedChange={(nextChecked) => setColumnVisible(column.id, nextChecked)}
									>
										<span className='grid size-4 place-items-center'>
											<BaseMenu.CheckboxItemIndicator>
												<Check className='size-3.5' />
											</BaseMenu.CheckboxItemIndicator>
										</span>
										<span>{column.label}</span>
									</BaseMenu.CheckboxItem>
								);
							})}
						</BaseMenu.Group>
					</BaseMenu.Popup>
				</BaseMenu.Positioner>
			</BaseMenu.Portal>
		</BaseMenu.Root>
	);
}

export type DataViewMenuItem = {
	id: string;
	label: ReactNode;
	icon?: ReactNode;
	disabled?: boolean;
	danger?: boolean;
	onSelect?: () => void;
};

export type DataViewMenuProps = {
	items: readonly DataViewMenuItem[];
	label?: string;
	disabled?: boolean;
	trigger?: ReactNode;
};

export function DataViewMenu({ items, label = '更多操作', disabled, trigger }: DataViewMenuProps) {
	return (
		<BaseMenu.Root>
			<BaseMenu.Trigger
				aria-label={label}
				title={label}
				disabled={disabled}
				className='border-base-300 bg-base-100 hover:bg-base-200 grid size-[var(--console-control-height)] shrink-0 place-items-center rounded-md border outline-none'
			>
				{trigger ?? <MoreHorizontal aria-hidden='true' className='size-4' />}
			</BaseMenu.Trigger>
			<BaseMenu.Portal>
				<BaseMenu.Positioner align='end' side='bottom' sideOffset={4} className='z-60 outline-none'>
					<BaseMenu.Popup className='border-base-300 bg-base-100 text-base-content min-w-44 rounded-md border p-1 shadow-xl outline-none'>
						{items.map((item) => (
							<BaseMenu.Item
								key={item.id}
								disabled={item.disabled}
								className={cn(
									'data-[highlighted]:bg-base-200 flex h-8 cursor-default items-center gap-2 rounded-sm px-2 text-xs outline-none data-[disabled]:opacity-45',
									item.danger && 'text-error',
								)}
								onClick={item.onSelect}
							>
								{item.icon ? <span className='grid size-4 place-items-center'>{item.icon}</span> : null}
								<span>{item.label}</span>
							</BaseMenu.Item>
						))}
					</BaseMenu.Popup>
				</BaseMenu.Positioner>
			</BaseMenu.Portal>
		</BaseMenu.Root>
	);
}
