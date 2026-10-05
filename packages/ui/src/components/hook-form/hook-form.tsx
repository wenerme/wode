'use client';

import { useImperativeHandle } from 'react';
import type { FieldValues, SubmitErrorHandler, SubmitHandler } from 'react-hook-form';
import { FormProvider, useForm } from 'react-hook-form';
import type { HookFormProps } from './hook-form-types';

export * from './hook-form-actions';
export * from './hook-form-field';
export type * from './hook-form-types';

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
	const handleInvalid: SubmitErrorHandler<TFieldValues> = (errors) => onInvalid?.(errors, methods);

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
