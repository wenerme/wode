import { type ComponentPropsWithoutRef, type FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CiLock, CiMail, CiUser } from 'react-icons/ci';
import { PiBuildingsThin, PiEyeSlashThin, PiEyeThin } from 'react-icons/pi';
import { ReactHookForm } from '../../react-hook-form';

export type LoginFormData = {
	org?: string;
	ticket?: string;
	password: string;
	username: string;
	email?: string;
	remember?: boolean;
};

export type LoginFormMode = 'username' | 'email';

export interface LoginFormProps extends Omit<ComponentPropsWithoutRef<'form'>, 'onSubmit'> {
	onSubmit?: (data: LoginFormData) => void;
	defaultValues?: Partial<LoginFormData>;
	showOrg?: boolean;
	orgValue?: string;
	onForgetPassword?: () => void;
	onRegister?: () => void;
	mode?: LoginFormMode;
	labels?: {
		org?: string;
		username?: string;
		email?: string;
		password?: string;
		remember?: string;
		forgetPassword?: string;
		submit?: string;
	};
}

export const LoginPageForm: FC<LoginFormProps> = ({
	onSubmit = () => undefined,
	defaultValues,
	showOrg,
	orgValue,
	onForgetPassword,
	onRegister,
	mode = 'username',
	labels,
	className,
	...props
}) => {
	const [showPassword, setShowPassword] = useState(false);
	const methods = useForm<LoginFormData>({
		defaultValues,
	});
	const {
		register,
		handleSubmit,
		formState: { isValid, isSubmitting },
	} = methods;

	const l = {
		org: labels?.org ?? '企业',
		username: labels?.username ?? '用户',
		email: labels?.email ?? 'Email',
		password: labels?.password ?? '密码',
		remember: labels?.remember ?? '记住登录',
		forgetPassword: labels?.forgetPassword ?? '忘了密码？',
		submit: labels?.submit ?? '登录',
	};

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
							placeholder={l.org}
							value={orgValue || undefined}
							readOnly={Boolean(orgValue)}
							required
							{...register('org', {
								required: true,
							})}
						/>
					</div>
				)}

				{mode === 'email' ? (
					<div className='join w-full'>
						<span className={'btn join-item'}>
							<CiMail className={'h-6 w-6'} />
						</span>
						<input
							type='email'
							autoComplete='email'
							className='input join-item flex-1'
							placeholder={l.email}
							required
							{...register('email', {
								required: true,
							})}
						/>
					</div>
				) : (
					<div className='join w-full'>
						<span className={'btn join-item'}>
							<CiUser className={'h-6 w-6'} />
						</span>
						<input
							autoComplete='username'
							className='input join-item flex-1'
							placeholder={l.username}
							required
							{...register('username', {
								required: true,
							})}
						/>
					</div>
				)}

				<div className='join w-full'>
					<span className={'btn join-item'}>
						<CiLock className={'h-6 w-6'} />
					</span>
					<input
						type={showPassword ? 'text' : 'password'}
						autoComplete='current-password'
						className='input join-item flex-1'
						placeholder={l.password}
						required
						{...register('password', {
							required: true,
						})}
					/>
					<button type='button' className='btn join-item' onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
						{showPassword ? <PiEyeSlashThin className='h-5 w-5' /> : <PiEyeThin className='h-5 w-5' />}
					</button>
				</div>
			</div>

			<div className='flex items-center justify-between'>
				<label className='flex items-center'>
					<input type='checkbox' className='checkbox checkbox-sm' {...register('remember')} />
					<div className='ml-3 block text-sm leading-6 opacity-75 select-none'>{l.remember}</div>
				</label>

				{onForgetPassword && (
					<div className='text-sm leading-6'>
						<button
							type={'button'}
							onClick={onForgetPassword}
							className='text-primary hover:text-primary/80 font-semibold'
						>
							{l.forgetPassword}
						</button>
					</div>
				)}
			</div>

			<div>
				<button type='submit' className='btn btn-primary w-full shadow-md' disabled={!isValid || isSubmitting}>
					{isSubmitting && <span className='loading loading-spinner loading-xs'></span>}
					{l.submit}
				</button>
			</div>
		</form>
	);
};
