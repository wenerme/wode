import React, { type ComponentPropsWithoutRef, type FC } from 'react';
import { useForm } from 'react-hook-form';
import { CiLock, CiUser } from 'react-icons/ci';
import { PiBuildingsThin } from 'react-icons/pi';
import { ReactHookForm } from '../../react-hook-form';

export type LoginFormData = {
	org?: string;
	ticket?: string;
	password: string;
	username: string;
	remember?: boolean;
};

export interface LoginFormProps extends Omit<ComponentPropsWithoutRef<'form'>, 'onSubmit'> {
	onSubmit?: (data: LoginFormData) => void;
	defaultValues?: Partial<LoginFormData>;
	showOrg?: boolean;
	orgValue?: string;
	onForgetPassword?: () => void;
	onRegister?: () => void;
}

export const LoginPageForm: FC<LoginFormProps> = ({
	onSubmit = () => undefined,
	defaultValues,
	showOrg,
	orgValue,
	onForgetPassword,
	onRegister,
	className,
	...props
}) => {
	const methods = useForm<LoginFormData>({
		defaultValues,
	});
	const {
		register,
		handleSubmit,
		formState: { isValid, isSubmitting },
	} = methods;

	return (
		<form
			onSubmit={handleSubmit(onSubmit, ReactHookForm.handleInvalid)}
			method='POST'
			className={`space-y-6 ${className || ''}`}
			{...props}
		>
			<div className={'flex flex-col gap-2'}>
				{showOrg && (
					<div className='join w-full'>
						<span className={'btn join-item'}>
							<PiBuildingsThin className={'h-6 w-6'} />
						</span>
						<input
							className='input join-item flex-1'
							placeholder={'企业'}
							value={orgValue || undefined}
							readOnly={Boolean(orgValue)}
							required
							{...register('org', {
								required: true,
							})}
						/>
					</div>
				)}

				<div className='join w-full'>
					<span className={'btn join-item'}>
						<CiUser className={'h-6 w-6'} />
					</span>
					<input
						autoComplete='username'
						className='input join-item flex-1'
						placeholder={'用户'}
						required
						{...register('username', {
							required: true,
						})}
					/>
				</div>

				<div className='join w-full'>
					<span className={'btn join-item'}>
						<CiLock className={'h-6 w-6'} />
					</span>
					<input
						type='password'
						autoComplete='current-password'
						className='input join-item flex-1'
						placeholder={'密码'}
						required
						{...register('password', {
							required: true,
						})}
					/>
				</div>
			</div>

			<div className='flex items-center justify-between'>
				<label className='flex items-center'>
					<input type='checkbox' className='checkbox h-4 w-4' {...register('remember')} />
					<div className='ml-3 block text-sm leading-6 opacity-75 select-none'>记住登录</div>
				</label>

				{onForgetPassword && (
					<div className='text-sm leading-6'>
						<button
							type={'button'}
							onClick={onForgetPassword}
							className='font-semibold text-indigo-600 hover:text-indigo-500'
						>
							忘了密码？
						</button>
					</div>
				)}
			</div>

			<div>
				<button
					type='submit'
					className='flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm leading-6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					disabled={!isValid || isSubmitting}
				>
					{isSubmitting && <span className='loading loading-spinner loading-xs'></span>}
					登录
				</button>
			</div>
		</form>
	);
};
