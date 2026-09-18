'use client';

import { useId } from 'react';
import type { FieldPath, FieldPathValue, FieldValues } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { cn } from '@/lib/utils';
import type { HookFormFieldContext, HookFormFieldProps } from './hook-form-types';

export function HookFormField<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	checkedValue = true,
	className,
	control,
	controlType = 'input',
	defaultValue,
	description,
	disabled,
	hint,
	inputClassName,
	inputProps,
	isChecked,
	label,
	name,
	parse,
	render,
	required,
	rules,
	shouldUnregister,
	size = 'md',
	textareaProps,
	type = 'text',
	uncheckedValue = false,
}: HookFormFieldProps<TFieldValues, TName>) {
	const id = useId();
	const fieldId = `${id}-field`;
	const hintId = `${id}-hint`;
	const errorId = `${id}-error`;
	const { field, fieldState, formState } = useController({
		control,
		defaultValue,
		disabled,
		name,
		rules: withRequiredRule(
			rules,
			required,
			type === 'checkbox'
				? (value) => (isChecked ? isChecked(value, checkedValue) : Object.is(value, checkedValue))
				: undefined,
		),
		shouldUnregister,
	});
	const invalid = Boolean(fieldState.invalid);
	const describedBy = joinIds(description || hint ? hintId : undefined, invalid ? errorId : undefined);
	const context: HookFormFieldContext<TFieldValues, TName> = {
		describedBy,
		errorId,
		field,
		fieldState,
		formState,
		hintId,
		id: fieldId,
		invalid,
	};

	return (
		<div className={cn('form-control w-full', className)} data-invalid={invalid || undefined}>
			{label && (
				<label className='label gap-2' htmlFor={fieldId}>
					<span className='label-text font-medium'>
						{label}
						{required && <span className='text-error ms-1'>*</span>}
					</span>
				</label>
			)}
			{render
				? render(context)
				: renderDefaultInput(context, {
						checkedValue,
						controlType,
						inputClassName,
						inputProps,
						isChecked,
						parse,
						size,
						textareaProps,
						type,
						uncheckedValue,
					})}
			{(description || hint || invalid) && (
				<div className='label min-h-6 items-start gap-2 py-1'>
					<span id={hintId} className='label-text-alt text-base-content/65'>
						{description || hint}
					</span>
					{invalid && (
						<span id={errorId} className='label-text-alt text-error text-right' role='alert'>
							{fieldState.error?.message || 'Invalid value'}
						</span>
					)}
				</div>
			)}
		</div>
	);
}

function renderDefaultInput<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
	{ describedBy, field, id, invalid }: HookFormFieldContext<TFieldValues, TName>,
	options: Pick<
		HookFormFieldProps<TFieldValues, TName>,
		| 'checkedValue'
		| 'controlType'
		| 'inputClassName'
		| 'inputProps'
		| 'isChecked'
		| 'parse'
		| 'size'
		| 'textareaProps'
		| 'type'
		| 'uncheckedValue'
	>,
) {
	const {
		checkedValue,
		controlType,
		inputClassName,
		inputProps,
		isChecked,
		parse,
		size,
		textareaProps,
		type,
		uncheckedValue,
	} = options;
	const className = cn(
		controlType === 'textarea' ? 'textarea w-full' : 'input w-full',
		size && (controlType === 'textarea' ? `textarea-${size}` : `input-${size}`),
		inputClassName,
	);
	const common = {
		'aria-describedby': describedBy,
		'aria-invalid': invalid || undefined,
		disabled: field.disabled,
		id,
		name: field.name,
		onBlur: field.onBlur,
		ref: field.ref,
	};
	if (controlType === 'textarea') {
		return (
			<textarea
				{...textareaProps}
				{...common}
				className={cn(className, textareaProps?.className)}
				value={field.value ?? ''}
				onChange={(event) =>
					field.onChange(parse ? parse(event.currentTarget.value, event) : event.currentTarget.value)
				}
			/>
		);
	}
	if (type === 'checkbox') {
		const checked = isChecked ? isChecked(field.value, checkedValue) : Object.is(field.value, checkedValue);
		return (
			<input
				{...inputProps}
				{...common}
				checked={checked}
				className={cn('checkbox', inputClassName, inputProps?.className)}
				type='checkbox'
				onChange={(event) => field.onChange(event.currentTarget.checked ? checkedValue : uncheckedValue)}
			/>
		);
	}
	return (
		<input
			{...inputProps}
			{...common}
			className={cn(className, inputProps?.className)}
			type={type}
			value={field.value ?? ''}
			onChange={(event) => field.onChange(parse ? parse(event.currentTarget.value, event) : event.currentTarget.value)}
		/>
	);
}

function withRequiredRule<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
	rules: HookFormFieldProps<TFieldValues, TName>['rules'],
	required: HookFormFieldProps<TFieldValues, TName>['required'],
	isRequiredValue?: (value: FieldPathValue<TFieldValues, TName>) => boolean,
) {
	if (!required) return rules;
	const message = typeof required === 'string' ? required : 'Required';
	if (isRequiredValue) {
		return {
			...rules,
			validate: mergeValidate<TFieldValues, TName>(rules?.validate, (value) => isRequiredValue(value) || message),
		};
	}
	if (rules?.required) return rules;
	return { ...rules, required: message };
}

function mergeValidate<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
	validate: NonNullable<HookFormFieldProps<TFieldValues, TName>['rules']>['validate'],
	requiredValidate: (value: FieldPathValue<TFieldValues, TName>) => true | string,
): NonNullable<HookFormFieldProps<TFieldValues, TName>['rules']>['validate'] {
	if (!validate) return requiredValidate;
	if (typeof validate === 'function') {
		return (value, formValues) => {
			const result = validate(value, formValues);
			if (isPromiseLike(result)) return result.then((next) => (next === true ? requiredValidate(value) : next));
			return result === true ? requiredValidate(value) : result;
		};
	}
	const requiredKey = '__hookFormRequired' in validate ? '__hookFormRequiredFallback' : '__hookFormRequired';
	return { ...validate, [requiredKey]: requiredValidate };
}

function isPromiseLike<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
	return typeof value === 'object' && value !== null && 'then' in value && typeof value.then === 'function';
}

function joinIds(...values: Array<string | false | null | undefined>) {
	const output = values.filter(Boolean).join(' ');
	return output || undefined;
}
