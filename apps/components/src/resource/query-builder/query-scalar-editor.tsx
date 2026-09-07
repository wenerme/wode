import { useEffect, useRef, useState } from 'react';
import {
	formatEditorValue,
	formatScalar,
	inputType,
	parseScalar,
	queryOptionKey,
	withOccurrenceKeys,
} from './query-editor-utils';
import type { QueryValueEditorProps } from './query-editors';
import type { QueryJsonValue } from './query-model';

export type ScalarEditorProps = QueryValueEditorProps & {
	ariaLabel: string;
};

export function ScalarEditor({
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
	return (
		<input
			id={id}
			type={inputType(kind)}
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
	const reconcileProposal = () => queueMicrotask(() => setDraft(formatScalar(latestValue.current)));
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
				if (draft.trim() && Number.isFinite(parsed) && (kind !== 'integer' || Number.isInteger(parsed)))
					onChange(parsed);
				reconcileProposal();
			}}
		/>
	);
}

function isCompleteNumber(value: string, kind: 'number' | 'integer') {
	return kind === 'integer' ? /^[+-]?\d+$/.test(value) : /^[+-]?(?:\d+|\d+\.\d+|\.\d+)(?:[eE][+-]?\d+)?$/.test(value);
}
