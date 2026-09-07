import { Popover as BasePopover } from '@base-ui/react/popover';
import { ChevronDown, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { focusAdjacentOption, focusFirstOption } from './query-editor-utils';
import type { QueryField } from './query-model';

export type QueryFieldPickerProps = {
	fields: readonly QueryField[];
	label: ReactNode;
	searchLabel: string;
	emptyLabel: string;
	disabled?: boolean;
	invalid?: boolean;
	ariaDescribedBy?: string;
	className?: string;
	onSelect: (field: QueryField) => void;
};

export function QueryFieldPicker({
	fields,
	label,
	searchLabel,
	emptyLabel,
	disabled,
	invalid,
	ariaDescribedBy,
	className,
	onSelect,
}: QueryFieldPickerProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');
	const optionsRef = useRef<HTMLDivElement>(null);
	const filtered = useMemo(() => {
		const needle = search.trim().toLocaleLowerCase();
		return needle
			? fields.filter((field) =>
					`${field.label} ${field.name} ${field.group ?? ''}`.toLocaleLowerCase().includes(needle),
				)
			: [...fields];
	}, [fields, search]);
	const groups = useMemo(() => groupFields(filtered), [filtered]);
	return (
		<BasePopover.Root
			open={open}
			onOpenChange={(nextOpen) => {
				setOpen(nextOpen);
				if (!nextOpen) setSearch('');
			}}
		>
			<BasePopover.Trigger
				render={
					<button
						type='button'
						disabled={disabled || fields.length === 0}
						className={cn('btn btn-outline btn-sm min-w-0 justify-between gap-2', className)}
						aria-invalid={invalid || undefined}
						aria-describedby={ariaDescribedBy}
					/>
				}
			>
				<span className='min-w-0 truncate'>{label}</span>
				<ChevronDown aria-hidden='true' className='size-3.5 shrink-0' />
			</BasePopover.Trigger>
			<BasePopover.Portal>
				<BasePopover.Positioner align='start' sideOffset={6} className='z-60'>
					<BasePopover.Popup className='border-base-300 bg-base-100 text-base-content w-[min(22rem,calc(100vw-2rem))] rounded-md border p-2 shadow-xl outline-none'>
						<label className='input input-sm input-bordered flex w-full items-center gap-2'>
							<Search aria-hidden='true' className='text-base-content/50 size-4 shrink-0' />
							<input
								type='search'
								className='min-w-0 grow'
								aria-label={searchLabel}
								placeholder={searchLabel}
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								onKeyDown={(event) => focusFirstOption(event, optionsRef.current)}
							/>
						</label>
						<div ref={optionsRef} data-query-options='' className='mt-2 max-h-72 overflow-auto'>
							{filtered.length === 0 ? (
								<div className='text-base-content/65 px-2 py-6 text-center text-sm'>{emptyLabel}</div>
							) : (
								groups.map(([group, entries]) => (
									<div key={group || 'fields'} className='py-1'>
										{group ? (
											<div className='text-base-content/65 px-2 py-1 text-[11px] font-semibold uppercase'>{group}</div>
										) : null}
										{entries.map((field) => (
											<button
												key={field.name}
												type='button'
												data-query-option='field'
												className='hover:bg-base-200 focus-visible:bg-base-200 flex w-full min-w-0 items-start rounded-sm px-2 py-2 text-left outline-none'
												onClick={() => {
													onSelect(field);
													setOpen(false);
												}}
												onKeyDown={focusAdjacentOption}
											>
												<span className='min-w-0'>
													<span className='block truncate text-sm font-medium'>{field.label}</span>
													{field.description ? (
														<span className='text-base-content/65 mt-0.5 line-clamp-2 block text-xs'>
															{field.description}
														</span>
													) : null}
												</span>
											</button>
										))}
									</div>
								))
							)}
						</div>
					</BasePopover.Popup>
				</BasePopover.Positioner>
			</BasePopover.Portal>
		</BasePopover.Root>
	);
}

function groupFields(fields: readonly QueryField[]) {
	const groups = new Map<string, QueryField[]>();
	for (const field of fields) {
		const group = field.group ?? '';
		const entries = groups.get(group) ?? [];
		entries.push(field);
		groups.set(group, entries);
	}
	return [...groups.entries()];
}
