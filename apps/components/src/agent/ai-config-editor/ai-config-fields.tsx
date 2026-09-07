'use client';

import { Eye, EyeOff, X } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useEffect, useId, useState } from 'react';
import type { AiConfigEditorOption } from './ai-config-types';

export type AiConfigFieldBase = {
	label: string;
	description?: string;
	error?: string;
	required?: boolean;
	wrapperClassName?: string;
};

export type AiConfigTextFieldProps = Omit<ComponentPropsWithRef<'input'>, 'value' | 'onChange' | 'type'> &
	AiConfigFieldBase & {
		value?: string;
		onValueChange: (value: string) => void;
		type?: 'text' | 'url' | 'date' | 'email';
	};

export function AiConfigTextField({
	label,
	description,
	error,
	required,
	wrapperClassName,
	value = '',
	onValueChange,
	className,
	id: providedId,
	...props
}: AiConfigTextFieldProps) {
	const generatedId = useId();
	const id = providedId ?? generatedId;
	const errorId = error ? `${id}-error` : undefined;
	return (
		<AiConfigFieldFrame
			label={label}
			description={description}
			error={error}
			errorId={errorId}
			required={required}
			className={wrapperClassName}
			htmlFor={id}
		>
			<input
				id={id}
				className={`input input-bordered w-full min-w-0 ${className ?? ''}`}
				aria-invalid={Boolean(error) || undefined}
				aria-describedby={errorId}
				value={value}
				onChange={(event) => onValueChange(event.target.value)}
				{...props}
			/>
		</AiConfigFieldFrame>
	);
}

export type AiConfigTextareaFieldProps = Omit<ComponentPropsWithRef<'textarea'>, 'value' | 'onChange'> &
	AiConfigFieldBase & {
		value?: string;
		onValueChange: (value: string) => void;
	};

export function AiConfigTextareaField({
	label,
	description,
	error,
	required,
	wrapperClassName,
	value = '',
	onValueChange,
	className,
	id: providedId,
	rows = 4,
	...props
}: AiConfigTextareaFieldProps) {
	const generatedId = useId();
	const id = providedId ?? generatedId;
	const errorId = error ? `${id}-error` : undefined;
	return (
		<AiConfigFieldFrame
			label={label}
			description={description}
			error={error}
			errorId={errorId}
			required={required}
			className={wrapperClassName}
			htmlFor={id}
		>
			<textarea
				id={id}
				className={`textarea textarea-bordered w-full min-w-0 ${className ?? ''}`}
				aria-invalid={Boolean(error) || undefined}
				aria-describedby={errorId}
				rows={rows}
				value={value}
				onChange={(event) => onValueChange(event.target.value)}
				{...props}
			/>
		</AiConfigFieldFrame>
	);
}

export type AiConfigSelectFieldProps = Omit<ComponentPropsWithRef<'select'>, 'value' | 'onChange'> &
	AiConfigFieldBase & {
		value?: string;
		onValueChange: (value: string) => void;
		options: readonly AiConfigEditorOption[];
		placeholder?: string;
	};

export function AiConfigSelectField({
	label,
	description,
	error,
	required,
	wrapperClassName,
	value = '',
	onValueChange,
	options,
	placeholder = '请选择',
	className,
	id: providedId,
	...props
}: AiConfigSelectFieldProps) {
	const generatedId = useId();
	const id = providedId ?? generatedId;
	const errorId = error ? `${id}-error` : undefined;
	const known = !value || options.some((option) => option.value === value);
	return (
		<AiConfigFieldFrame
			label={label}
			description={description}
			error={error}
			errorId={errorId}
			required={required}
			className={wrapperClassName}
			htmlFor={id}
		>
			<select
				id={id}
				className={`select select-bordered w-full min-w-0 ${className ?? ''}`}
				aria-invalid={Boolean(error) || undefined}
				aria-describedby={errorId}
				value={value}
				onChange={(event) => onValueChange(event.target.value)}
				{...props}
			>
				<option value=''>{placeholder}</option>
				{!known ? <option value={value}>{value}（当前值）</option> : null}
				{options.map((option) => (
					<option key={option.value} value={option.value} disabled={option.disabled}>
						{option.label}
					</option>
				))}
			</select>
		</AiConfigFieldFrame>
	);
}

export type AiConfigNumberFieldProps = Omit<ComponentPropsWithRef<'input'>, 'value' | 'onChange' | 'type'> &
	AiConfigFieldBase & {
		value?: number | null;
		onValueChange: (value: number | undefined) => void;
		integer?: boolean;
	};

export function AiConfigNumberField({
	label,
	description,
	error,
	required,
	wrapperClassName,
	value,
	onValueChange,
	integer = false,
	className,
	id: providedId,
	...props
}: AiConfigNumberFieldProps) {
	const generatedId = useId();
	const id = providedId ?? generatedId;
	const external = value === undefined || value === null ? '' : String(value);
	const [draft, setDraft] = useState(external);
	useEffect(() => setDraft(external), [external]);
	const issueId = error ? `${id}-error` : undefined;
	return (
		<AiConfigFieldFrame
			label={label}
			description={description}
			error={error}
			errorId={issueId}
			required={required}
			className={wrapperClassName}
			htmlFor={id}
		>
			<input
				id={id}
				type='number'
				step={integer ? 1 : 'any'}
				className={`input input-bordered w-full min-w-0 ${className ?? ''}`}
				aria-invalid={Boolean(error) || undefined}
				aria-describedby={issueId}
				value={draft}
				onChange={(event) => {
					const next = event.target.value;
					setDraft(next);
					if (next === '') onValueChange(undefined);
					else {
						const number = Number(next);
						if (Number.isFinite(number) && (!integer || Number.isInteger(number))) onValueChange(number);
					}
				}}
				{...props}
			/>
		</AiConfigFieldFrame>
	);
}

export type AiConfigToggleFieldProps = Omit<ComponentPropsWithRef<'input'>, 'checked' | 'onChange' | 'type'> &
	AiConfigFieldBase & {
		checked: boolean;
		onCheckedChange: (checked: boolean) => void;
	};

export function AiConfigToggleField({
	label,
	description,
	error,
	wrapperClassName,
	checked,
	onCheckedChange,
	className,
	id: providedId,
	...props
}: AiConfigToggleFieldProps) {
	const generatedId = useId();
	const id = providedId ?? generatedId;
	return (
		<div className={`min-w-0 ${wrapperClassName ?? ''}`}>
			<label
				htmlFor={id}
				className='border-base-300 flex min-h-12 cursor-pointer items-center gap-3 rounded-sm border px-3 py-2'
			>
				<span className='min-w-0 flex-1'>
					<span className='block text-sm font-medium'>{label}</span>
					{description ? <span className='text-base-content/60 block text-xs'>{description}</span> : null}
				</span>
				<input
					id={id}
					type='checkbox'
					className={`toggle toggle-sm ${className ?? ''}`}
					checked={checked}
					onChange={(event) => onCheckedChange(event.target.checked)}
					{...props}
				/>
			</label>
			{error ? (
				<p className='text-error mt-1 text-xs' role='alert'>
					{error}
				</p>
			) : null}
		</div>
	);
}

export type AiConfigSecretFieldProps = Omit<AiConfigTextFieldProps, 'type'> & {
	clearLabel?: string;
	revealLabel?: string;
	hideLabel?: string;
	revealIdentity?: number | string;
};

export function AiConfigSecretField({
	label,
	value = '',
	onValueChange,
	clearLabel = '清除密钥',
	revealLabel = '显示密钥',
	hideLabel = '隐藏密钥',
	revealIdentity,
	description,
	error,
	required,
	wrapperClassName,
	className,
	id: providedId,
	readOnly,
	disabled,
	...inputProps
}: AiConfigSecretFieldProps) {
	const [revealed, setRevealed] = useState(false);
	useEffect(() => setRevealed(false), [revealIdentity]);
	const generatedId = useId();
	const id = providedId ?? generatedId;
	const errorId = error ? `${id}-error` : undefined;
	return (
		<AiConfigFieldFrame
			label={label}
			description={description}
			error={error}
			errorId={errorId}
			required={required}
			htmlFor={id}
			className={wrapperClassName}
		>
			<div className='join flex w-full'>
				<input
					id={id}
					type={revealed ? 'text' : 'password'}
					className={`input input-bordered join-item min-w-0 flex-1 font-mono ${className ?? ''}`}
					aria-invalid={Boolean(error) || undefined}
					aria-describedby={errorId}
					value={value}
					readOnly={readOnly}
					disabled={disabled}
					autoComplete='off'
					onChange={(event) => onValueChange(event.target.value)}
					{...inputProps}
				/>
				<button
					type='button'
					className='btn btn-outline join-item btn-square'
					title={revealed ? hideLabel : revealLabel}
					aria-label={revealed ? hideLabel : revealLabel}
					disabled={disabled}
					onClick={() => setRevealed((current) => !current)}
				>
					{revealed ? <EyeOff aria-hidden='true' className='size-4' /> : <Eye aria-hidden='true' className='size-4' />}
				</button>
				{!readOnly ? (
					<button
						type='button'
						className='btn btn-outline join-item btn-square'
						title={clearLabel}
						aria-label={clearLabel}
						disabled={disabled || !value}
						onClick={() => onValueChange('')}
					>
						<X aria-hidden='true' className='size-4' />
					</button>
				) : null}
			</div>
		</AiConfigFieldFrame>
	);
}

export type AiConfigFieldFrameProps = ComponentPropsWithRef<'div'> & {
	label: string;
	description?: string;
	error?: string;
	errorId?: string;
	required?: boolean;
	htmlFor?: string;
	children: ReactNode;
};

export function AiConfigFieldFrame({
	label,
	description,
	error,
	errorId,
	required,
	htmlFor,
	children,
	className,
	...props
}: AiConfigFieldFrameProps) {
	return (
		<div className={`min-w-0 ${className ?? ''}`} {...props}>
			<label htmlFor={htmlFor} className='mb-1 block text-sm font-medium'>
				{label}
				{required ? (
					<span className='text-error ms-1' aria-hidden='true'>
						*
					</span>
				) : null}
			</label>
			{description ? <p className='text-base-content/60 mb-1 text-xs'>{description}</p> : null}
			{children}
			{error ? (
				<p id={errorId} className='text-error mt-1 text-xs' role='alert'>
					{error}
				</p>
			) : null}
		</div>
	);
}
