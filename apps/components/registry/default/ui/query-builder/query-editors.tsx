import { Popover as BasePopover } from '@base-ui/react/popover';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';
import type { ComponentType, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { QueryBuilderMessages } from './query-messages';
import type {
	QueryField,
	QueryFieldKind,
	QueryJsonPrimitive,
	QueryJsonValue,
	QueryOperator,
	QueryRule,
} from './query-model';

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

export type QueryValueEditorProps = {
	id: string;
	rule: QueryRule;
	field: QueryField;
	operator: QueryOperator;
	value: QueryJsonValue;
	disabled?: boolean;
	readOnly?: boolean;
	invalid?: boolean;
	ariaDescribedBy?: string;
	messages: QueryBuilderMessages;
	onChange: (value: QueryJsonValue) => void;
};

export type QueryValueEditorComponent = ComponentType<QueryValueEditorProps>;
export type QueryValueEditorRenderer = (props: QueryValueEditorProps) => ReactNode | undefined;

export function QueryDefaultValueEditor(props: QueryValueEditorProps) {
	const { operator, field, value, messages } = props;
	if (props.readOnly) return <QueryReadOnlyValue {...props} />;
	if (operator.cardinality === 'none') {
		return <span className='text-base-content/65 inline-flex min-h-8 items-center text-xs'>{messages.noValue}</span>;
	}
	if (operator.cardinality === 'pair') {
		const pair = Array.isArray(value) && value.length === 2 ? value : [null, null];
		return (
			<div className='grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2'>
				<ScalarEditor
					{...props}
					id={`${props.id}-start`}
					ariaLabel={messages.rangeStart}
					value={pair[0]}
					onChange={(next) => props.onChange([next, pair[1]])}
				/>
				<span aria-hidden='true' className='text-base-content/55 text-xs'>
					–
				</span>
				<ScalarEditor
					{...props}
					id={`${props.id}-end`}
					ariaLabel={messages.rangeEnd}
					value={pair[1]}
					onChange={(next) => props.onChange([pair[0], next])}
				/>
			</div>
		);
	}
	if (operator.cardinality === 'many') {
		return field.options?.length ? <MultiOptionEditor {...props} /> : <ListValueEditor {...props} />;
	}
	return <ScalarEditor {...props} ariaLabel={field.label} value={value} onChange={props.onChange} />;
}

export function QueryReadOnlyValue({ id, field, operator, value, messages, ariaDescribedBy }: QueryValueEditorProps) {
	const values = Array.isArray(value) ? value : [value];
	const label = (item: QueryJsonValue) => {
		if (typeof item === 'boolean') return item ? messages.trueLabel : messages.falseLabel;
		return field.options?.find((option) => Object.is(option.value, item))?.label ?? String(item ?? '');
	};
	const text =
		operator.cardinality === 'none'
			? messages.noValue
			: operator.cardinality === 'pair'
				? `${label(values[0])} – ${label(values[1])}`
				: values.map(label).filter(Boolean).join(', ');
	return (
		<output
			id={id}
			aria-label={field.label}
			aria-describedby={ariaDescribedBy}
			className='border-base-300 bg-base-100 flex min-h-8 w-full min-w-0 items-center rounded-sm border px-2.5 text-sm'
		>
			{text || messages.chooseValue}
		</output>
	);
}

type ScalarEditorProps = QueryValueEditorProps & {
	ariaLabel: string;
};

function ScalarEditor({
	id,
	field,
	value,
	disabled,
	invalid,
	messages,
	ariaLabel,
	ariaDescribedBy,
	onChange,
}: ScalarEditorProps) {
	const kind = field.kind === 'array' ? (field.itemKind ?? 'unknown') : field.kind;
	if (field.options?.length) {
		const selected = field.options.findIndex((option) => Object.is(option.value, value));
		return (
			<select
				id={id}
				className='select select-bordered select-sm w-full min-w-0'
				aria-label={ariaLabel}
				aria-invalid={invalid || undefined}
				aria-describedby={ariaDescribedBy}
				disabled={disabled}
				value={selected < 0 ? '' : String(selected)}
				onChange={(event) =>
					onChange(event.target.value === '' ? null : (field.options?.[Number(event.target.value)]?.value ?? null))
				}
			>
				<option value=''>{messages.chooseValue}</option>
				{withOccurrenceKeys(field.options, queryOptionKey).map(({ item: option, key }, index) => (
					<option key={key} value={index} disabled={option.disabled}>
						{option.label}
					</option>
				))}
			</select>
		);
	}
	if (kind === 'boolean') {
		return (
			<select
				id={id}
				className='select select-bordered select-sm w-full min-w-0'
				aria-label={ariaLabel}
				aria-invalid={invalid || undefined}
				aria-describedby={ariaDescribedBy}
				disabled={disabled}
				value={typeof value === 'boolean' ? String(value) : ''}
				onChange={(event) => onChange(event.target.value === '' ? null : event.target.value === 'true')}
			>
				<option value=''>{messages.chooseValue}</option>
				<option value='true'>{messages.trueLabel}</option>
				<option value='false'>{messages.falseLabel}</option>
			</select>
		);
	}
	if (kind === 'number' || kind === 'integer') {
		return (
			<NumberEditor
				id={id}
				kind={kind}
				value={value}
				disabled={disabled}
				invalid={invalid}
				ariaLabel={ariaLabel}
				ariaDescribedBy={ariaDescribedBy}
				onChange={onChange}
			/>
		);
	}
	const type = inputType(kind);
	return (
		<input
			id={id}
			type={type}
			className='input input-bordered input-sm w-full min-w-0'
			aria-label={ariaLabel}
			aria-invalid={invalid || undefined}
			aria-describedby={ariaDescribedBy}
			disabled={disabled}
			step={kind === 'datetime' ? 1 : undefined}
			placeholder={field.placeholder}
			value={formatEditorValue(value, kind)}
			onChange={(event) => onChange(parseScalar(event.target.value, kind))}
		/>
	);
}

function NumberEditor({
	id,
	kind,
	value,
	disabled,
	invalid,
	ariaLabel,
	ariaDescribedBy,
	onChange,
}: {
	id: string;
	kind: 'number' | 'integer';
	value: QueryJsonValue;
	disabled?: boolean;
	invalid?: boolean;
	ariaLabel: string;
	ariaDescribedBy?: string;
	onChange: (value: QueryJsonValue) => void;
}) {
	const [draft, setDraft] = useState(() => formatScalar(value));
	const latestValue = useRef(value);
	latestValue.current = value;
	useEffect(() => setDraft(formatScalar(value)), [value]);
	const reconcileProposal = () => {
		queueMicrotask(() => setDraft(formatScalar(latestValue.current)));
	};
	return (
		<input
			id={id}
			type='number'
			className='input input-bordered input-sm w-full min-w-0'
			aria-label={ariaLabel}
			aria-invalid={invalid || undefined}
			aria-describedby={ariaDescribedBy}
			disabled={disabled}
			step={kind === 'integer' ? 1 : 'any'}
			value={draft}
			onChange={(event) => {
				const next = event.target.value;
				setDraft(next);
				if (next === '') {
					onChange(null);
					reconcileProposal();
				} else if (isCompleteNumber(next, kind)) {
					onChange(Number(next));
					reconcileProposal();
				}
			}}
			onBlur={() => {
				const parsed = Number(draft);
				if (draft.trim() && Number.isFinite(parsed) && (kind !== 'integer' || Number.isInteger(parsed))) {
					onChange(parsed);
				}
				reconcileProposal();
			}}
		/>
	);
}

function isCompleteNumber(value: string, kind: 'number' | 'integer') {
	return kind === 'integer' ? /^[+-]?\d+$/.test(value) : /^[+-]?(?:\d+|\d+\.\d+|\.\d+)(?:[eE][+-]?\d+)?$/.test(value);
}

function MultiOptionEditor({
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

function ListValueEditor({
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
	messages: QueryBuilderMessages;
	onChange: (value: QueryJsonValue) => void;
}) {
	if (!values.length) return null;
	const entries = withOccurrenceKeys(values, queryValueKey);
	return (
		<div className='mt-1.5 flex min-w-0 flex-wrap gap-1'>
			{entries.map(({ item: value, key }, index) => {
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

function queryOptionKey(option: { label: string; value: QueryJsonPrimitive }) {
	return `${queryValueKey(option.value)}:${option.label}`;
}

function queryValueKey(value: QueryJsonValue): string {
	if (value === null) return 'null';
	if (Array.isArray(value)) return `array:${value.map(queryValueKey).join('|')}`;
	if (typeof value === 'number') {
		if (Object.is(value, -0)) return 'number:-0';
		if (Number.isNaN(value)) return 'number:NaN';
	}
	if (typeof value === 'object') {
		return `object:${Object.keys(value)
			.sort()
			.map((key) => `${key}:${queryValueKey(value[key])}`)
			.join('|')}`;
	}
	return `${typeof value}:${String(value)}`;
}

function withOccurrenceKeys<T>(items: readonly T[], getIdentity: (item: T) => string) {
	const occurrences = new Map<string, number>();
	return items.map((item) => {
		const identity = getIdentity(item);
		const occurrence = occurrences.get(identity) ?? 0;
		occurrences.set(identity, occurrence + 1);
		return { item, key: `${identity}:${occurrence}` };
	});
}

function focusFirstOption(event: ReactKeyboardEvent<HTMLInputElement>, container: HTMLDivElement | null) {
	if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
	event.preventDefault();
	const options = [
		...(container?.querySelectorAll<HTMLButtonElement>('button[data-query-option]:not(:disabled)') ?? []),
	];
	const target = event.key === 'ArrowUp' || event.key === 'End' ? options.at(-1) : options[0];
	target?.focus();
}

function focusAdjacentOption(event: ReactKeyboardEvent<HTMLButtonElement>) {
	if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
	const container = event.currentTarget.closest<HTMLElement>('[data-query-options]');
	const options = [
		...(container?.querySelectorAll<HTMLButtonElement>('button[data-query-option]:not(:disabled)') ?? []),
	];
	const current = options.indexOf(event.currentTarget);
	if (current < 0 || options.length === 0) return;
	event.preventDefault();
	const target =
		event.key === 'Home'
			? 0
			: event.key === 'End'
				? options.length - 1
				: (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
	options[target]?.focus();
}

function inputType(kind: QueryFieldKind) {
	if (kind === 'number' || kind === 'integer') return 'number';
	if (kind === 'date') return 'date';
	if (kind === 'datetime') return 'datetime-local';
	return 'text';
}

function parseScalar(value: string, kind: QueryFieldKind): QueryJsonPrimitive {
	if (!value.trim()) return null;
	if (kind === 'number' || kind === 'integer') {
		const parsed = Number(value);
		return Number.isFinite(parsed) && (kind !== 'integer' || Number.isInteger(parsed)) ? parsed : null;
	}
	if (kind === 'boolean') return value === 'true' ? true : value === 'false' ? false : null;
	if (kind === 'datetime') {
		const parsed = new Date(value);
		return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
	}
	return value;
}

function formatEditorValue(value: QueryJsonValue, kind: QueryFieldKind) {
	if (kind !== 'datetime' || typeof value !== 'string') return formatScalar(value);
	const parsed = new Date(value);
	if (!Number.isFinite(parsed.getTime())) return '';
	const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
	return local.toISOString().slice(0, 19);
}

function formatScalar(value: QueryJsonValue) {
	return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}
