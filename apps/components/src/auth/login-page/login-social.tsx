import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type LoginPageSocialItem = {
	disabled?: boolean;
	icon?: ReactNode;
	id?: string;
	name: string;
	onClick: () => void;
};

export type LoginPageSocialLoginProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
	columns?: 1 | 2 | 3;
	socials?: readonly LoginPageSocialItem[];
	title?: ReactNode;
};

export function LoginPageSocialLogin({
	columns = 2,
	socials,
	title = '其他登录方式',
	className,
	...props
}: LoginPageSocialLoginProps) {
	if (!socials?.length) return null;
	const columnsClass = {
		1: 'grid-cols-1',
		2: 'grid-cols-1 sm:grid-cols-2',
		3: 'grid-cols-1 sm:grid-cols-3',
	}[columns];

	return (
		<div data-slot='login-page-social' className={cn('mt-8', className)} {...props}>
			<div className='relative'>
				<div className='absolute inset-0 flex items-center' aria-hidden='true'>
					<div className='border-base-300 w-full border-t' />
				</div>
				<div className='relative flex justify-center text-xs font-medium'>
					<span className='bg-base-100 text-base-content/60 px-4'>{title}</span>
				</div>
			</div>
			<div className={cn('mt-5 grid gap-2', columnsClass)}>
				{socials.map((social) => (
					<button
						key={social.id ?? social.name}
						type='button'
						disabled={social.disabled}
						className='border-base-300 bg-base-100 hover:bg-base-200/70 inline-flex h-9 min-w-0 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50'
						onClick={social.onClick}
					>
						{social.icon ? <span className='grid size-4 shrink-0 place-items-center'>{social.icon}</span> : null}
						<span className='truncate'>{social.name}</span>
					</button>
				))}
			</div>
		</div>
	);
}
