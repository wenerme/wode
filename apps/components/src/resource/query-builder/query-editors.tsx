import type { ComponentType, ReactNode } from 'react';
import type { QueryBuilderMessages } from './query-messages';
import type { QueryField, QueryJsonValue, QueryOperator, QueryRule } from './query-model';
import { ListValueEditor, MultiOptionEditor } from './query-list-editors';
import { ScalarEditor } from './query-scalar-editor';

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
	if (operator.cardinality === 'many')
		return field.options?.length ? <MultiOptionEditor {...props} /> : <ListValueEditor {...props} />;
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

export * from './query-field-picker';
