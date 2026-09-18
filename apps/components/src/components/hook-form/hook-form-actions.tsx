'use client';

import { useId, useRef, useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import type {
	HookFormDataPreviewButtonProps,
	HookFormDebugButtonProps,
	HookFormErrorSummaryProps,
	HookFormSubmitButtonProps,
} from './hook-form-types';
import { getDirtyValues, getFieldErrors } from './hook-form-utils';

export function HookFormErrorSummary({
	className,
	errors,
	includePath = true,
	maxItems = 6,
	title = 'Please fix the highlighted fields.',
	...props
}: HookFormErrorSummaryProps) {
	const { formState } = useFormContext();
	const items = getFieldErrors(errors ?? formState.errors).slice(0, maxItems);
	if (items.length === 0) return null;
	return (
		<div {...props} className={cn('alert alert-error text-sm', className)} role='alert'>
			<div>
				<div className='font-medium'>{title}</div>
				<ul className='mt-1 list-disc ps-5'>
					{items.map(({ message, path, type }) => (
						<li key={`${path}:${type ?? ''}:${message}`}>{includePath && path ? `${path}: ${message}` : message}</li>
					))}
				</ul>
			</div>
		</div>
	);
}

export function HookFormSubmitButton({
	children = 'Submit',
	className,
	dirtyOnly = false,
	disabled,
	loadingText,
	showSpinner = true,
	...props
}: HookFormSubmitButtonProps) {
	const { formState } = useFormContext();
	const busy = formState.isSubmitting;
	const blocked = Boolean(disabled || formState.disabled || busy || (dirtyOnly && !formState.isDirty));
	return (
		<button {...props} type='submit' className={cn('btn btn-primary', className)} disabled={blocked}>
			{showSpinner && busy && <span className='loading loading-spinner loading-xs' aria-hidden='true' />}
			{busy && loadingText ? loadingText : children}
		</button>
	);
}

export function HookFormDebugButton({
	children = 'Debug',
	className,
	enabled = true,
	...props
}: HookFormDebugButtonProps) {
	const methods = useFormContext();
	if (!enabled) return null;
	return (
		<button
			{...props}
			type='button'
			className={cn('btn btn-ghost', className)}
			onClick={(event) => {
				props.onClick?.(event);
				if (event.defaultPrevented) return;
				const { formState } = methods;
				console.log('[HookFormDebug]', {
					dirty: getDirtyValues(methods),
					dirtyFields: formState.dirtyFields,
					disabled: formState.disabled,
					errors: formState.errors,
					isDirty: formState.isDirty,
					isLoading: formState.isLoading,
					isSubmitSuccessful: formState.isSubmitSuccessful,
					isSubmitted: formState.isSubmitted,
					isSubmitting: formState.isSubmitting,
					isValid: formState.isValid,
					isValidating: formState.isValidating,
					submitCount: formState.submitCount,
					touchedFields: formState.touchedFields,
					values: methods.getValues(),
				});
			}}
		>
			{children}
		</button>
	);
}

export function HookFormDataPreviewButton<TFieldValues extends FieldValues = FieldValues>({
	children = 'Data preview',
	className,
	dialogTitle = 'Form data',
	format = (data) => JSON.stringify(data, null, 2),
	onLoad,
	onParseError,
	parse = (text) => JSON.parse(text) as TFieldValues,
	textareaLabel = 'Form data JSON',
	...props
}: HookFormDataPreviewButtonProps<TFieldValues>) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [error, setError] = useState('');
	const [text, setText] = useState('');
	const methods = useFormContext<TFieldValues>();
	const titleId = useId();
	const open = () => {
		setError('');
		setText(format(methods.getValues()));
		dialogRef.current?.showModal();
	};
	const close = () => dialogRef.current?.close();
	const load = async () => {
		try {
			const next = await parse(text);
			methods.reset(next);
			onLoad?.(next);
			close();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : String(cause));
			onParseError?.(cause);
		}
	};
	return (
		<>
			<button
				{...props}
				type='button'
				className={cn('btn', className)}
				onClick={(event) => {
					props.onClick?.(event);
					if (!event.defaultPrevented) open();
				}}
			>
				{children}
			</button>
			<dialog ref={dialogRef} className='modal' aria-labelledby={titleId}>
				<div className='modal-box max-w-3xl'>
					<h2 id={titleId} className='text-lg font-semibold'>
						{dialogTitle}
					</h2>
					<textarea
						aria-label={textareaLabel}
						className='textarea mt-4 min-h-80 w-full font-mono text-xs'
						value={text}
						onChange={(event) => setText(event.currentTarget.value)}
					/>
					{error && (
						<p className='text-error mt-2 text-sm' role='alert'>
							{error}
						</p>
					)}
					<div className='modal-action'>
						<div className='join'>
							<button type='button' className='btn join-item btn-sm' onClick={() => setText('')}>
								Clear
							</button>
							<button
								type='button'
								className='btn join-item btn-sm'
								onClick={() => setText(format(methods.getValues()))}
							>
								Refresh
							</button>
							<button type='button' className='btn btn-primary join-item btn-sm' onClick={load}>
								Load
							</button>
							<button type='button' className='btn join-item btn-sm' onClick={close}>
								Close
							</button>
						</div>
					</div>
				</div>
			</dialog>
		</>
	);
}
