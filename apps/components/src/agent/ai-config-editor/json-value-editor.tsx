'use client';

import { Check, RotateCcw } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { useEffect, useState } from 'react';
import { stringifyAiConfig } from './ai-config-validation';

export type JsonValueEditorProps = Omit<ComponentPropsWithRef<'div'>, 'onChange'> & {
	label: string;
	value: unknown;
	onChange: (value: unknown) => void;
	description?: string;
	disabled?: boolean;
	readOnly?: boolean;
	error?: string;
	rows?: number;
	applyLabel?: string;
	resetLabel?: string;
};

export function JsonValueEditor({
	label,
	value,
	onChange,
	description,
	disabled = false,
	readOnly = false,
	error,
	rows = 7,
	applyLabel = '应用 JSON',
	resetLabel = '重置 JSON',
	className,
	...props
}: JsonValueEditorProps) {
	const serialized = stringifyAiConfig(value);
	const [draft, setDraft] = useState(serialized);
	const [parseError, setParseError] = useState<string>();
	useEffect(() => {
		setDraft(serialized);
		setParseError(undefined);
	}, [serialized]);
	const issue = parseError ?? error;
	const apply = () => {
		try {
			onChange(JSON.parse(draft));
			setParseError(undefined);
		} catch (caught) {
			setParseError(caught instanceof Error ? caught.message : 'JSON 内容无效');
		}
	};
	return (
		<div className={className} {...props}>
			<div className='mb-1 flex min-w-0 items-end justify-between gap-2'>
				<div className='min-w-0'>
					<label className='text-sm font-medium'>{label}</label>
					{description ? <p className='text-base-content/60 text-xs'>{description}</p> : null}
				</div>
				{!readOnly ? (
					<div className='flex shrink-0 gap-1'>
						<button
							type='button'
							className='btn btn-ghost btn-xs btn-square'
							title={resetLabel}
							aria-label={resetLabel}
							disabled={disabled || draft === serialized}
							onClick={() => {
								setDraft(serialized);
								setParseError(undefined);
							}}
						>
							<RotateCcw aria-hidden='true' className='size-3.5' />
						</button>
						<button
							type='button'
							className='btn btn-outline btn-xs btn-square'
							title={applyLabel}
							aria-label={applyLabel}
							disabled={disabled || draft === serialized}
							onClick={apply}
						>
							<Check aria-hidden='true' className='size-3.5' />
						</button>
					</div>
				) : null}
			</div>
			<textarea
				className='textarea textarea-bordered w-full font-mono text-xs leading-5'
				aria-label={label}
				aria-invalid={Boolean(issue) || undefined}
				readOnly={readOnly}
				disabled={disabled}
				rows={rows}
				value={draft}
				onChange={(event) => {
					setDraft(event.target.value);
					setParseError(undefined);
				}}
			/>
			{issue ? (
				<p className='text-error mt-1 text-xs' role='alert'>
					{issue}
				</p>
			) : null}
		</div>
	);
}
