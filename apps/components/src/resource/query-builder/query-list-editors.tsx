import { Popover as BasePopover } from '@base-ui/react/popover';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
	focusAdjacentOption,
	focusFirstOption,
	inputType,
	parseScalar,
	queryOptionKey,
	queryValueKey,
	withOccurrenceKeys,
} from './query-editor-utils';
import type { QueryValueEditorProps } from './query-editors';
import type { QueryJsonPrimitive, QueryJsonValue } from './query-model';

export function MultiOptionEditor({
	field,
	value,
	disabled,
	invalid,
	ariaDescribedBy,
	messages,
	onChange,
}: QueryValueEditorProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [selectedOnly, setSelectedOnly] = useState(false);
	const optionsRef = useRef<HTMLDivElement>(null);
	const selected = Array.isArray(value) ? value : [];
	const options = field.options ?? [];
	const filtered = options.filter((option) => {
		const matchesSearch = option.label.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
		return matchesSearch && (!selectedOnly || selected.some((item) => Object.is(item, option.value)));
	});
	const toggle = (option: QueryJsonPrimitive) => {
		const exists = selected.some((item) => Object.is(item, option));
		onChange(exists ? selected.filter((item) => !Object.is(item, option)) : [...selected, option]);
	};
	return (
		<div className='min-w-0'>
			<BasePopover.Root open={open} onOpenChange={setOpen}>
				<BasePopover.Trigger
					render={
						<button
							type='button'
							className='btn btn-outline btn-sm w-full min-w-0 justify-between'
							disabled={disabled}
							aria-invalid={invalid || undefined}
							aria-describedby={ariaDescribedBy}
						/>
					}
				>
					<span className='truncate'>
						{selected.length ? messages.selectedCount(selected.length) : messages.chooseValue}
					</span>
					<ChevronDown aria-hidden='true' className='size-3.5 shrink-0' />
				</BasePopover.Trigger>
				<BasePopover.Portal>
					<BasePopover.Positioner align='start' sideOffset={6} className='z-60'>
						<BasePopover.Popup className='border-base-300 bg-base-100 w-[min(20rem,calc(100vw-2rem))] rounded-md border p-2 shadow-xl outline-none'>
							<label className='input input-sm input-bordered flex w-full items-center gap-2'>
								<Search aria-hidden='true' className='size-4' />
								<input
									type='search'
									className='min-w-0 grow'
									aria-label={messages.searchValues}
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									onKeyDown={(event) => focusFirstOption(event, optionsRef.current)}
								/>
							</label>
							<div className='mt-2 flex items-center justify-between gap-2 px-1'>
								<label className='label cursor-pointer gap-2 py-1 text-xs'>
									<input
										type='checkbox'
										className='checkbox checkbox-xs'
										checked={selectedOnly}
										onChange={(event) => setSelectedOnly(event.target.checked)}
									/>
									{messages.selectedOnly}
								</label>
								<button
									type='button'
									className='btn btn-ghost btn-xs'
									disabled={selected.length === 0}
									onClick={() => onChange([])}
								>
									{messages.clearValues}
								</button>
							</div>
							<div ref={optionsRef} data-query-options='' className='mt-1 max-h-60 overflow-auto'>
								{withOccurrenceKeys(filtered, queryOptionKey).map(({ item: option, key }) => {
									const active = selected.some((item) => Object.is(item, option.value));
									return (
										<button
											key={key}
											type='button'
											data-query-option='value'
											aria-pressed={active}
											disabled={option.disabled}
											className='hover:bg-base-200 flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm'
											onClick={() => toggle(option.value)}
											onKeyDown={focusAdjacentOption}
										>
											<Check aria-hidden='true' className={cn('size-4 shrink-0', !active && 'invisible')} />
											<span className='min-w-0 truncate'>{option.label}</span>
										</button>
									);
								})}
							</div>
						</BasePopover.Popup>
					</BasePopover.Positioner>
				</BasePopover.Portal>
			</BasePopover.Root>
			<ValueChips values={selected} options={options} disabled={disabled} messages={messages} onChange={onChange} />
		</div>
	);
}

export function ListValueEditor({
	rule,
	field,
	value,
	disabled,
	invalid,
	ariaDescribedBy,
	messages,
	onChange,
}: QueryValueEditorProps) {
	const [draft, setDraft] = useState('');
	useEffect(() => setDraft(''), [rule.id, rule.operator]);
	const values = Array.isArray(value) ? value : [];
	const itemKind = field.kind === 'array' ? (field.itemKind ?? 'unknown') : field.kind;
	const add = () => {
		const next = parseScalar(draft, itemKind);
		if (next === null || values.some((item) => Object.is(item, next))) return;
		onChange([...values, next]);
		setDraft('');
	};
	return (
		<div className='min-w-0'>
			<div className='flex min-w-0 gap-1.5'>
				{itemKind === 'boolean' ? (
					<select
						className='select select-bordered select-sm min-w-0 flex-1'
						aria-label={messages.addValue}
						aria-invalid={invalid || undefined}
						aria-describedby={ariaDescribedBy}
						disabled={disabled}
						value={draft}
						onChange={(event) => setDraft(event.target.value)}
					>
						<option value=''>{messages.chooseValue}</option>
						<option value='true'>{messages.trueLabel}</option>
						<option value='false'>{messages.falseLabel}</option>
					</select>
				) : (
					<input
						type={inputType(itemKind)}
						className='input input-bordered input-sm min-w-0 flex-1'
						aria-label={messages.addValue}
						aria-invalid={invalid || undefined}
						aria-describedby={ariaDescribedBy}
						disabled={disabled}
						step={itemKind === 'datetime' ? 1 : undefined}
						value={draft}
						onChange={(event) => setDraft(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								add();
							}
						}}
					/>
				)}
				<button
					type='button'
					className='btn btn-outline btn-sm btn-square'
					title={messages.addValue}
					aria-label={messages.addValue}
					disabled={disabled || draft.trim().length === 0}
					onClick={add}
				>
					<Plus aria-hidden='true' className='size-4' />
				</button>
			</div>
			<ValueChips values={values} disabled={disabled} messages={messages} onChange={onChange} />
		</div>
	);
}

function ValueChips({
	values,
	options,
	disabled,
	messages,
	onChange,
}: {
	values: QueryJsonValue[];
	options?: readonly { value: QueryJsonPrimitive; label: string }[];
	disabled?: boolean;
	messages: QueryValueEditorProps['messages'];
	onChange: (value: QueryJsonValue) => void;
}) {
	if (!values.length) return null;
	return (
		<div className='mt-1.5 flex min-w-0 flex-wrap gap-1'>
			{withOccurrenceKeys(values, queryValueKey).map(({ item: value, key }, index) => {
				const label = options?.find((option) => Object.is(option.value, value))?.label ?? String(value);
				return (
					<span key={key} className='badge badge-outline h-6 max-w-full gap-1 pe-1 text-xs'>
						<span className='truncate'>{label}</span>
						<button
							type='button'
							className='hover:bg-base-200 grid size-4 shrink-0 place-items-center rounded-full'
							title={messages.removeValue}
							aria-label={messages.actionLabel(messages.removeValue, label)}
							disabled={disabled}
							onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
						>
							<X aria-hidden='true' className='size-3' />
						</button>
					</span>
				);
			})}
		</div>
	);
}
