'use client';

import {
	type ChangeEvent,
	type ComponentPropsWithRef,
	type ReactNode,
	type Ref,
	useId,
	useImperativeHandle,
	useRef,
	useState,
} from 'react';
import {
	type ControllerFieldState,
	type ControllerRenderProps,
	type FieldErrors,
	type FieldPath,
	type FieldPathValue,
	type FieldValues,
	FormProvider,
	type SubmitErrorHandler,
	type SubmitHandler,
	type UseControllerProps,
	type UseFormProps,
	type UseFormReturn,
	type UseFormStateReturn,
	useController,
	useForm,
	useFormContext,
} from 'react-hook-form';
import { getDirtyValues, getFieldErrors } from './hook-form-utils';

export type HookFormSubmitHandler<TFieldValues extends FieldValues = FieldValues, TContext = unknown> = (
	data: TFieldValues,
	methods: UseFormReturn<TFieldValues, TContext>,
) => void | Promise<void>;

export type HookFormInvalidHandler<TFieldValues extends FieldValues = FieldValues, TContext = unknown> = (
	errors: FieldErrors<TFieldValues>,
	methods: UseFormReturn<TFieldValues, TContext>,
) => void;

export type HookFormProps<TFieldValues extends FieldValues = FieldValues, TContext = unknown> = UseFormProps<
	TFieldValues,
	TContext
> & {
	children?: ReactNode;
	formProps?: Omit<ComponentPropsWithRef<'form'>, 'children' | 'onSubmit' | 'ref'>;
	formRef?: Ref<HTMLFormElement>;
	methodsRef?: Ref<UseFormReturn<TFieldValues, TContext>>;
	onInvalid?: HookFormInvalidHandler<TFieldValues, TContext>;
	onSubmit?: HookFormSubmitHandler<TFieldValues, TContext>;
	preventImplicitSubmit?: boolean;
};

export type HookFormFieldContext<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
	describedBy?: string;
	errorId: string;
	field: ControllerRenderProps<TFieldValues, TName>;
	fieldState: ControllerFieldState;
	formState: UseFormStateReturn<TFieldValues>;
	hintId: string;
	id: string;
	invalid: boolean;
};

export type HookFormFieldProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = UseControllerProps<TFieldValues, TName> & {
	checkedValue?: unknown;
	className?: string;
	controlType?: 'input' | 'textarea';
	description?: ReactNode;
	hint?: ReactNode;
	inputClassName?: string;
	inputProps?: Omit<ComponentPropsWithRef<'input'>, 'defaultValue' | 'name' | 'onBlur' | 'onChange' | 'ref' | 'value'>;
	isChecked?: (value: unknown, checkedValue: unknown) => boolean;
	label?: ReactNode;
	parse?: (value: string, event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => unknown;
	render?: (context: HookFormFieldContext<TFieldValues, TName>) => ReactNode;
	required?: boolean | string;
	size?: 'xs' | 'sm' | 'md' | 'lg';
	textareaProps?: Omit<
		ComponentPropsWithRef<'textarea'>,
		'defaultValue' | 'name' | 'onBlur' | 'onChange' | 'ref' | 'value'
	>;
	type?: ComponentPropsWithRef<'input'>['type'];
	uncheckedValue?: unknown;
};

export type HookFormErrorSummaryProps = ComponentPropsWithRef<'div'> & {
	errors?: FieldErrors;
	includePath?: boolean;
	maxItems?: number;
	title?: ReactNode;
};

export type HookFormSubmitButtonProps = ComponentPropsWithRef<'button'> & {
	dirtyOnly?: boolean;
	loadingText?: ReactNode;
	showSpinner?: boolean;
};

export type HookFormDebugButtonProps = ComponentPropsWithRef<'button'> & {
	enabled?: boolean;
};

export type HookFormDataPreviewButtonProps<TFieldValues extends FieldValues = FieldValues> =
	ComponentPropsWithRef<'button'> & {
		dialogTitle?: ReactNode;
		format?: (data: TFieldValues) => string;
		onLoad?: (data: TFieldValues) => void;
		onParseError?: (error: unknown) => void;
		parse?: (text: string) => TFieldValues | Promise<TFieldValues>;
		textareaLabel?: string;
	};

export function HookForm<TFieldValues extends FieldValues = FieldValues, TContext = unknown>({
	children,
	formProps,
	formRef,
	methodsRef,
	mode = 'onBlur',
	onInvalid,
	onSubmit,
	preventImplicitSubmit = true,
	...options
}: HookFormProps<TFieldValues, TContext>) {
	const methods = useForm<TFieldValues, TContext>({ mode, ...options });
	useImperativeHandle(methodsRef, () => methods, [methods]);

	const handleValid: SubmitHandler<TFieldValues> = (data) => onSubmit?.(data, methods);
	const handleInvalid: SubmitErrorHandler<TFieldValues> = (errors) => {
		onInvalid?.(errors, methods);
	};

	return (
		<FormProvider {...methods}>
			<form
				noValidate
				autoComplete='off'
				{...formProps}
				ref={formRef}
				onSubmit={methods.handleSubmit(handleValid, handleInvalid)}
			>
				{preventImplicitSubmit && <button type='submit' disabled hidden aria-hidden='true' tabIndex={-1} />}
				{children}
			</form>
		</FormProvider>
	);
}

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
	const controller = useController({
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
	const { field, fieldState, formState } = controller;
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
		<div className={joinClassNames('form-control w-full', className)} data-invalid={invalid || undefined}>
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
		<div {...props} className={joinClassNames('alert alert-error text-sm', className)} role='alert'>
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
		<button {...props} type='submit' className={joinClassNames('btn btn-primary', className)} disabled={blocked}>
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
			className={joinClassNames('btn btn-ghost', className)}
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
			const message = cause instanceof Error ? cause.message : String(cause);
			setError(message);
			onParseError?.(cause);
		}
	};
	return (
		<>
			<button
				{...props}
				type='button'
				className={joinClassNames('btn', className)}
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
						className='textarea textarea-bordered mt-4 min-h-80 w-full font-mono text-xs'
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

function renderDefaultInput<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
	{ describedBy, field, id, invalid }: HookFormFieldContext<TFieldValues, TName>,
	{
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
	}: Pick<
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
	const className = joinClassNames(
		controlType === 'textarea' ? 'textarea textarea-bordered w-full' : 'input input-bordered w-full',
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
				className={joinClassNames(className, textareaProps?.className)}
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
				className={joinClassNames('checkbox', inputClassName, inputProps?.className)}
				type='checkbox'
				onChange={(event) => field.onChange(event.currentTarget.checked ? checkedValue : uncheckedValue)}
			/>
		);
	}
	return (
		<input
			{...inputProps}
			{...common}
			className={joinClassNames(className, inputProps?.className)}
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
	return {
		...rules,
		required: message,
	};
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
	return {
		...validate,
		[requiredKey]: requiredValidate,
	};
}

function isPromiseLike<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
	return typeof value === 'object' && value !== null && 'then' in value && typeof value.then === 'function';
}

function joinClassNames(...values: Array<string | false | null | undefined>) {
	return values.filter(Boolean).join(' ');
}

function joinIds(...values: Array<string | false | null | undefined>) {
	const output = values.filter(Boolean).join(' ');
	return output || undefined;
}
