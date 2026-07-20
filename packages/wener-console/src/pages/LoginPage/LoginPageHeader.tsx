import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';

export interface LoginPageHeaderProps extends ComponentPropsWithoutRef<'div'> {
	logo?: ReactNode;
	title?: string;
	subtitle?: ReactNode;
	onRegister?: () => void;
	labels?: {
		registerPrompt?: string;
		registerAction?: string;
	};
}

export const LoginPageHeader: FC<LoginPageHeaderProps> = ({
	logo,
	title,
	subtitle,
	onRegister,
	labels,
	className,
	...props
}) => {
	return (
		<div className={className} {...props}>
			<div className={'flex items-center gap-2'}>
				{logo} <span className={'text-xl font-medium'}>{title}</span>
			</div>
			{subtitle && <h2 className='mt-8 text-2xl leading-9 font-bold tracking-tight opacity-80'>{subtitle}</h2>}
			{onRegister && (
				<p className='mt-2 text-sm leading-6 opacity-60'>
					{labels?.registerPrompt ?? '尚未加入?'}{' '}
					<button type={'button'} onClick={onRegister} className='font-semibold text-primary hover:text-primary/80'>
						{labels?.registerAction ?? '现在注册'}
					</button>
				</p>
			)}
		</div>
	);
};
