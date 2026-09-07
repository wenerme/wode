'use client';

import { Plus, Trash2, X } from 'lucide-react';
import type { ComponentPropsWithRef, KeyboardEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { AiConfigFieldFrame } from './ai-config-fields';
import { useStableListEntries } from './use-stable-list-entries';

export type AiConfigStringListFieldProps = Omit<ComponentPropsWithRef<'div'>, 'onChange'> & {
	label: string;
	value?: readonly string[];
	onChange: (value: string[]) => void;
	description?: string;
	error?: string;
	placeholder?: string;
	addLabel?: string;
	removeLabel?: (value: string) => string;
	disabled?: boolean;
	readOnly?: boolean;
	maxItems?: number;
};

export function AiConfigStringListField({
	label,
	value = [],
	onChange,
	description,
	error,
	placeholder = '输入后按回车',
	addLabel = '添加',
	removeLabel = (item) => `移除 ${item}`,
	disabled = false,
	readOnly = false,
	maxItems = 128,
	className,
	...props
}: AiConfigStringListFieldProps) {
	const id = useId();
	const composing = useRef(false);
	const [draft, setDraft] = useState('');
	const entries = useStableListEntries(value, 'string-list-item');
	const add = () => {
		const next = draft.trim();
		if (!next || value.includes(next) || value.length >= maxItems) return;
		onChange([...value, next]);
		setDraft('');
	};
	return (
		<AiConfigFieldFrame
			label={label}
			description={description}
			error={error}
			htmlFor={id}
			className={className}
			{...props}
		>
			{!readOnly ? (
				<div className='flex min-w-0 gap-2'>
					<input
						id={id}
						className='input input-bordered min-w-0 flex-1'
						placeholder={placeholder}
						value={draft}
						disabled={disabled || value.length >= maxItems}
						onChange={(event) => setDraft(event.target.value)}
						onCompositionStart={() => {
							composing.current = true;
						}}
						onCompositionEnd={() => {
							composing.current = false;
						}}
						onKeyDown={(event) => submitOnEnter(event, add, composing.current)}
					/>
					<button
						type='button'
						className='btn btn-outline btn-square'
						title={addLabel}
						aria-label={addLabel}
						disabled={disabled || !draft.trim() || value.length >= maxItems}
						onClick={add}
					>
						<Plus aria-hidden='true' className='size-4' />
					</button>
				</div>
			) : null}
			<div className='mt-2 flex min-h-7 min-w-0 flex-wrap gap-1.5'>
				{value.length ? (
					entries.map(({ item, key }, index) => (
						<span key={key} className='badge badge-outline h-7 max-w-full gap-1 pe-1'>
							<span className='truncate'>{item}</span>
							{!readOnly ? (
								<button
									type='button'
									className='hover:bg-base-200 grid size-5 shrink-0 place-items-center rounded-full'
									title={removeLabel(item)}
									aria-label={removeLabel(item)}
									disabled={disabled}
									onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
								>
									<X aria-hidden='true' className='size-3' />
								</button>
							) : null}
						</span>
					))
				) : (
					<span className='text-base-content/50 text-xs'>暂无条目</span>
				)}
			</div>
		</AiConfigFieldFrame>
	);
}

export type AiConfigKeyValueFieldProps = Omit<ComponentPropsWithRef<'div'>, 'onChange'> & {
	label: string;
	value?: Readonly<Record<string, string>>;
	onChange: (value: Record<string, string>) => void;
	description?: string;
	error?: string;
	keyLabel?: string;
	valueLabel?: string;
	addLabel?: string;
	removeLabel?: (key: string) => string;
	disabled?: boolean;
	readOnly?: boolean;
	maxItems?: number;
};

export function AiConfigKeyValueField({
	label,
	value = {},
	onChange,
	description,
	error,
	keyLabel = '键',
	valueLabel = '值',
	addLabel = '添加键值',
	removeLabel = (key) => `移除 ${key}`,
	disabled = false,
	readOnly = false,
	maxItems = 128,
	className,
	...props
}: AiConfigKeyValueFieldProps) {
	const composing = useRef(false);
	const [newKey, setNewKey] = useState('');
	const [newValue, setNewValue] = useState('');
	const entries = Object.entries(value);
	const add = () => {
		const key = newKey.trim();
		if (!key || Object.hasOwn(value, key) || entries.length >= maxItems) return;
		onChange(withAiConfigMapEntry(value, key, newValue));
		setNewKey('');
		setNewValue('');
	};
	return (
		<AiConfigFieldFrame label={label} description={description} error={error} className={className} {...props}>
			<div className='space-y-1.5'>
				{entries.map(([key, entryValue]) => (
					<AiConfigMapRow
						key={key}
						entryKey={key}
						entryValue={entryValue}
						keyLabel={keyLabel}
						valueLabel={valueLabel}
						disabled={disabled}
						readOnly={readOnly}
						onCommit={(nextKey, nextValue) => {
							if (!nextKey || (nextKey !== key && Object.hasOwn(value, nextKey))) return;
							onChange(withAiConfigMapEntry(value, nextKey, nextValue, key));
						}}
						onRemove={() => onChange(withoutAiConfigMapEntry(value, key))}
						removeLabel={removeLabel(key)}
					/>
				))}
			</div>
			{!readOnly ? (
				<div className='mt-2 grid min-w-0 grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)_auto] gap-1.5'>
					<input
						className='input input-bordered min-w-0'
						aria-label={`${label} ${keyLabel}`}
						placeholder={keyLabel}
						value={newKey}
						disabled={disabled || entries.length >= maxItems}
						onChange={(event) => setNewKey(event.target.value)}
					/>
					<input
						className='input input-bordered min-w-0'
						aria-label={`${label} ${valueLabel}`}
						placeholder={valueLabel}
						value={newValue}
						disabled={disabled || entries.length >= maxItems}
						onChange={(event) => setNewValue(event.target.value)}
						onCompositionStart={() => {
							composing.current = true;
						}}
						onCompositionEnd={() => {
							composing.current = false;
						}}
						onKeyDown={(event) => submitOnEnter(event, add, composing.current)}
					/>
					<button
						type='button'
						className='btn btn-outline btn-square'
						title={addLabel}
						aria-label={addLabel}
						disabled={disabled || !newKey.trim() || entries.length >= maxItems}
						onClick={add}
					>
						<Plus aria-hidden='true' className='size-4' />
					</button>
				</div>
			) : null}
		</AiConfigFieldFrame>
	);
}

type AiConfigMapRowProps = {
	entryKey: string;
	entryValue: string;
	keyLabel: string;
	valueLabel: string;
	disabled: boolean;
	readOnly: boolean;
	removeLabel: string;
	onCommit: (key: string, value: string) => void;
	onRemove: () => void;
};

function AiConfigMapRow({
	entryKey,
	entryValue,
	keyLabel,
	valueLabel,
	disabled,
	readOnly,
	removeLabel,
	onCommit,
	onRemove,
}: AiConfigMapRowProps) {
	const [keyDraft, setKeyDraft] = useState(entryKey);
	const [valueDraft, setValueDraft] = useState(entryValue);
	useEffect(() => setKeyDraft(entryKey), [entryKey]);
	useEffect(() => setValueDraft(entryValue), [entryValue]);
	if (readOnly)
		return (
			<div className='border-base-300 grid grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] gap-2 rounded-sm border px-2 py-1.5 text-sm'>
				<code className='truncate'>{entryKey}</code>
				<span className='truncate'>{entryValue}</span>
			</div>
		);
	return (
		<div className='grid min-w-0 grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)_auto] gap-1.5'>
			<input
				className='input input-bordered input-sm min-w-0 font-mono'
				aria-label={keyLabel}
				value={keyDraft}
				disabled={disabled}
				onChange={(event) => setKeyDraft(event.target.value)}
				onBlur={() => onCommit(keyDraft.trim(), valueDraft)}
			/>
			<input
				className='input input-bordered input-sm min-w-0'
				aria-label={valueLabel}
				value={valueDraft}
				disabled={disabled}
				onChange={(event) => {
					const next = event.target.value;
					setValueDraft(next);
					onCommit(keyDraft.trim(), next);
				}}
			/>
			<button
				type='button'
				className='btn btn-ghost btn-sm btn-square text-error'
				title={removeLabel}
				aria-label={removeLabel}
				disabled={disabled}
				onClick={onRemove}
			>
				<Trash2 aria-hidden='true' className='size-4' />
			</button>
		</div>
	);
}

export function withAiConfigMapEntry(
	value: Readonly<Record<string, string>>,
	key: string,
	entryValue: string,
	previousKey?: string,
): Record<string, string> {
	const next = copyAiConfigMap(value, previousKey);
	Object.defineProperty(next, key, { value: entryValue, enumerable: true, configurable: true, writable: true });
	return next;
}

export function withoutAiConfigMapEntry(value: Readonly<Record<string, string>>, key: string): Record<string, string> {
	return copyAiConfigMap(value, key);
}

function copyAiConfigMap(value: Readonly<Record<string, string>>, omittedKey?: string): Record<string, string> {
	const next = Object.create(null) as Record<string, string>;
	for (const [key, entryValue] of Object.entries(value)) {
		if (key === omittedKey) continue;
		Object.defineProperty(next, key, { value: entryValue, enumerable: true, configurable: true, writable: true });
	}
	return next;
}

function submitOnEnter(event: KeyboardEvent<HTMLInputElement>, submit: () => void, composing: boolean) {
	if (event.key !== 'Enter' || composing || event.nativeEvent.isComposing) return;
	event.preventDefault();
	submit();
}
