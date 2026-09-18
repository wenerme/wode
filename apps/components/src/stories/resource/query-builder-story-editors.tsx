import type { QueryValueEditorProps } from '@/resource/query-builder';

export function OwnerEditor({
	id,
	value,
	disabled,
	readOnly,
	invalid,
	ariaDescribedBy,
	onChange,
}: QueryValueEditorProps) {
	const owners: Record<string, string> = {
		'owner-ada': 'Ada · 大客户组',
		'owner-lin': 'Lin · 增长组',
		'owner-maya': 'Maya · 战略组',
	};
	if (readOnly) {
		return (
			<output
				id={id}
				aria-label='客户负责人'
				aria-describedby={ariaDescribedBy}
				className='border-base-300 flex min-h-8 items-center rounded-sm border px-2.5 text-sm'
			>
				{typeof value === 'string' ? (owners[value] ?? value) : '选择负责人'}
			</output>
		);
	}
	return (
		<select
			id={id}
			className='select select-bordered select-sm w-full min-w-0'
			aria-label='客户负责人'
			aria-invalid={invalid || undefined}
			aria-describedby={ariaDescribedBy}
			disabled={disabled}
			value={typeof value === 'string' ? value : ''}
			onChange={(event) => onChange(event.target.value || null)}
		>
			<option value=''>选择负责人</option>
			<option value='owner-ada'>Ada · 大客户组</option>
			<option value='owner-lin'>Lin · 增长组</option>
			<option value='owner-maya'>Maya · 战略组</option>
		</select>
	);
}

export function RiskScoreEditor({
	id,
	value,
	disabled,
	readOnly,
	invalid,
	ariaDescribedBy,
	onChange,
}: QueryValueEditorProps) {
	const score = typeof value === 'number' ? value : 50;
	if (readOnly) {
		return (
			<output
				id={id}
				aria-label='风险评分'
				aria-describedby={ariaDescribedBy}
				className='border-base-300 flex min-h-8 items-center rounded-sm border px-2.5 text-sm tabular-nums'
			>
				{score}
			</output>
		);
	}
	return (
		<div className='flex min-w-0 items-center gap-3'>
			<input
				id={id}
				type='range'
				className='range range-primary range-xs min-w-0 flex-1'
				aria-label='风险评分'
				aria-invalid={invalid || undefined}
				aria-describedby={ariaDescribedBy}
				disabled={disabled}
				min={0}
				max={100}
				value={score}
				onChange={(event) => onChange(Number(event.target.value))}
			/>
			<output htmlFor={id} className='badge badge-outline w-11 shrink-0 tabular-nums'>
				{score}
			</output>
		</div>
	);
}

export const customerValueEditors = { owner: OwnerEditor, 'risk-score': RiskScoreEditor };
