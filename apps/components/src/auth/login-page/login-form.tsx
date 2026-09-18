'use client';

import { Building2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useEffect, useId, useState } from 'react';
import {
	Controller,
	type FieldErrors,
	type Mode,
	type SubmitErrorHandler,
	type SubmitHandler,
	useForm,
} from 'react-hook-form';
import { cn } from '@/lib/utils';

export type LoginPageFormMode = 'username' | 'email';

export type LoginPageFormValues = {
	org?: string;
	username?: string;
	email?: string;
	password: string;
	remember: boolean;
};

export type LoginPageFormLabels = {
	org?: string;
	username?: string;
	email?: string;
	password?: string;
	remember?: string;
	forgotPassword?: string;
	submit?: string;
	submitting?: string;
	showPassword?: string;
	hidePassword?: string;
};

export type LoginPageFormIcons = {
	org?: ReactNode;
	username?: ReactNode;
	email?: ReactNode;
	password?: ReactNode;
	showPassword?: ReactNode;
	hidePassword?: ReactNode;
};

export type LoginPageFormSubmitState = {
	disabled: boolean;
	isSubmitting: boolean;
	isValid: boolean;
};

export type LoginPageFormProps = Omit<ComponentPropsWithRef<'form'>, 'defaultValue' | 'onSubmit'> & {
	actions?: ReactNode;
	afterFields?: ReactNode;
	beforeFields?: ReactNode;
	defaultValues?: Partial<LoginPageFormValues>;
	disabled?: boolean;
	icons?: LoginPageFormIcons;
	labels?: LoginPageFormLabels;
	mode?: LoginPageFormMode;
	onForgotPassword?: () => void;
	onInvalid?: SubmitErrorHandler<LoginPageFormValues>;
	onSubmit?: (values: LoginPageFormValues) => void | Promise<void>;
	orgValue?: string;
	renderSubmit?: (state: LoginPageFormSubmitState) => ReactNode;
	showOrg?: boolean;
	showPasswordToggle?: boolean;
	showRemember?: boolean;
	validationMode?: Mode;
};

export function LoginPageForm({
	actions,
	afterFields,
	beforeFields,
	className,
	defaultValues,
	disabled = false,
	icons,
	labels,
	mode = 'username',
	onForgotPassword,
	onInvalid,
	onSubmit,
	orgValue,
	renderSubmit,
	showOrg = false,
	showPasswordToggle = true,
	showRemember = true,
	validationMode = 'onChange',
	...props
}: LoginPageFormProps) {
	const id = useId();
	const [showPassword, setShowPassword] = useState(false);
	const {
		control,
		handleSubmit,
		register,
		setValue,
		formState: { errors, isSubmitting, isValid },
	} = useForm<LoginPageFormValues>({
		mode: validationMode,
		defaultValues: {
			remember: false,
			...defaultValues,
			...(orgValue !== undefined ? { org: orgValue } : {}),
		},
	});

	useEffect(() => {
		if (orgValue !== undefined) setValue('org', orgValue, { shouldValidate: true });
	}, [orgValue, setValue]);

	const text = {
		org: labels?.org ?? '组织',
		username: labels?.username ?? '用户名',
		email: labels?.email ?? 'Email',
		password: labels?.password ?? '密码',
		remember: labels?.remember ?? '记住登录',
		forgotPassword: labels?.forgotPassword ?? '忘记密码？',
		submit: labels?.submit ?? '登录',
		submitting: labels?.submitting ?? '登录中',
		showPassword: labels?.showPassword ?? '显示密码',
		hidePassword: labels?.hidePassword ?? '隐藏密码',
	};
	const submitState = {
		disabled: disabled || isSubmitting || (validationMode !== 'onSubmit' && !isValid),
		isSubmitting,
		isValid,
	};
	const submitValid: SubmitHandler<LoginPageFormValues> = (values) => onSubmit?.(values);

	return (
		<form
			{...props}
			noValidate
			className={cn('mt-8 space-y-5', className)}
			onSubmit={handleSubmit(submitValid, onInvalid)}
		>
			{beforeFields}
			<div className='space-y-4'>
				{showOrg ? (
					<LoginPageFormField
						id={`${id}-org`}
						label={text.org}
						icon={icons?.org ?? <Building2 className='size-4' />}
						error={errors.org}
					>
						<input
							id={`${id}-org`}
							autoComplete='organization'
							className='min-w-0 flex-1 bg-transparent outline-none'
							defaultValue={orgValue ?? defaultValues?.org}
							disabled={disabled}
							readOnly={orgValue !== undefined}
							required
							aria-invalid={Boolean(errors.org)}
							aria-describedby={errors.org ? `${id}-org-error` : undefined}
							{...register('org', { required: `${text.org}不能为空` })}
						/>
					</LoginPageFormField>
				) : null}

				{mode === 'email' ? (
					<LoginPageFormField
						id={`${id}-email`}
						label={text.email}
						icon={icons?.email ?? <Mail className='size-4' />}
						error={errors.email}
					>
						<input
							id={`${id}-email`}
							type='email'
							autoComplete='email'
							className='min-w-0 flex-1 bg-transparent outline-none'
							defaultValue={defaultValues?.email}
							disabled={disabled}
							required
							aria-invalid={Boolean(errors.email)}
							aria-describedby={errors.email ? `${id}-email-error` : undefined}
							{...register('email', {
								required: `${text.email}不能为空`,
								pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: `${text.email}格式不正确` },
							})}
						/>
					</LoginPageFormField>
				) : (
					<LoginPageFormField
						id={`${id}-username`}
						label={text.username}
						icon={icons?.username ?? <UserRound className='size-4' />}
						error={errors.username}
					>
						<input
							id={`${id}-username`}
							autoComplete='username'
							className='min-w-0 flex-1 bg-transparent outline-none'
							defaultValue={defaultValues?.username}
							disabled={disabled}
							required
							aria-invalid={Boolean(errors.username)}
							aria-describedby={errors.username ? `${id}-username-error` : undefined}
							{...register('username', { required: `${text.username}不能为空` })}
						/>
					</LoginPageFormField>
				)}

				<LoginPageFormField
					id={`${id}-password`}
					label={text.password}
					icon={icons?.password ?? <LockKeyhole className='size-4' />}
					error={errors.password}
					actions={
						showPasswordToggle ? (
							<button
								type='button'
								aria-label={showPassword ? text.hidePassword : text.showPassword}
								title={showPassword ? text.hidePassword : text.showPassword}
								className='hover:bg-base-200 grid size-8 shrink-0 place-items-center rounded'
								disabled={disabled}
								onClick={() => setShowPassword((current) => !current)}
							>
								{showPassword
									? (icons?.hidePassword ?? <EyeOff className='size-4' />)
									: (icons?.showPassword ?? <Eye className='size-4' />)}
							</button>
						) : null
					}
				>
					<input
						id={`${id}-password`}
						type={showPassword ? 'text' : 'password'}
						autoComplete='current-password'
						className='min-w-0 flex-1 bg-transparent outline-none'
						defaultValue={defaultValues?.password}
						disabled={disabled}
						required
						aria-invalid={Boolean(errors.password)}
						aria-describedby={errors.password ? `${id}-password-error` : undefined}
						{...register('password', { required: `${text.password}不能为空` })}
					/>
				</LoginPageFormField>
			</div>
			{afterFields}

			{actions !== undefined ? (
				actions
			) : showRemember || onForgotPassword ? (
				<div className='flex min-h-8 flex-wrap items-center justify-between gap-3'>
					{showRemember ? (
						<Controller
							name='remember'
							control={control}
							render={({ field }) => (
								<label className='inline-flex cursor-pointer items-center gap-2 text-sm'>
									<input
										type='checkbox'
										name={field.name}
										ref={field.ref}
										checked={field.value === true}
										className='checkbox checkbox-sm'
										disabled={disabled}
										onBlur={field.onBlur}
										onChange={(event) => field.onChange(event.target.checked)}
									/>
									<span>{text.remember}</span>
								</label>
							)}
						/>
					) : (
						<span />
					)}
					{onForgotPassword ? (
						<button
							type='button'
							className='text-primary hover:text-primary/80 text-sm font-semibold'
							disabled={disabled}
							onClick={onForgotPassword}
						>
							{text.forgotPassword}
						</button>
					) : null}
				</div>
			) : null}

			{renderSubmit ? (
				renderSubmit(submitState)
			) : (
				<button
					type='submit'
					className='bg-primary text-primary-content inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50'
					disabled={submitState.disabled}
				>
					{isSubmitting ? <LoaderCircle aria-hidden='true' className='size-4 animate-spin' /> : null}
					{isSubmitting ? text.submitting : text.submit}
				</button>
			)}
		</form>
	);
}

type LoginPageFormFieldProps = {
	actions?: ReactNode;
	children: ReactNode;
	error?: FieldErrors<LoginPageFormValues>[keyof LoginPageFormValues];
	icon?: ReactNode;
	id: string;
	label: ReactNode;
};

function LoginPageFormField({ actions, children, error, icon, id, label }: LoginPageFormFieldProps) {
	return (
		<div className='grid gap-1.5'>
			<label className='text-base-content/75 text-xs font-medium' htmlFor={id}>
				{label}
			</label>
			<div className='border-base-300 bg-base-100 focus-within:border-primary focus-within:ring-primary focus-within:ring-offset-base-100 flex min-h-10 items-center gap-2 rounded-md border px-2 focus-within:ring-2 focus-within:ring-offset-2'>
				{icon ? <span className='text-base-content/45 grid size-5 shrink-0 place-items-center'>{icon}</span> : null}
				{children}
				{actions}
			</div>
			{error?.message ? (
				<span id={`${id}-error`} role='alert' className='text-error text-xs'>
					{String(error.message)}
				</span>
			) : null}
		</div>
	);
}
