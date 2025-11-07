import React, { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { WechatBrandIcon, WecomBrandIcon } from '../../icons';
import { cn } from '../../utils/cn';

export interface SocialLoginProps extends ComponentPropsWithoutRef<'div'> {
	socials?: Array<{
		name: string;
		icon?: ReactNode;
		onClick: () => void;
	}>;
}

export const LoginPageSocialLogin: FC<SocialLoginProps> = ({ socials, className, ...props }) => {
	if (!socials || socials.length === 0) {
		return null;
	}

	return (
		<div className={cn('mt-10', className)} {...props}>
			<div className='relative'>
				<div className='absolute inset-0 flex items-center' aria-hidden='true'>
					<div className='w-full border-t border-gray-200' />
				</div>
				<div className='relative flex justify-center text-sm leading-6 font-medium'>
					<span className='bg-white px-6 opacity-80'>社交方式登录</span>
				</div>
			</div>

			<div className='mt-6 grid grid-cols-2 gap-4'>
				{socials.map((social, index) => (
					<button key={index} type='button' onClick={social.onClick} className={clsx('btn btn-sm rounded-md')}>
						{social.icon || (social.name === 'Wechat' && <WechatBrandIcon className={'h-4 w-4'} />)}
						{social.name === 'Wechat' && !social.icon && (
							<span className='text-sm leading-6 font-semibold'>Wechat</span>
						)}
						{social.name === 'Wecom' && !social.icon && (
							<>
								<WecomBrandIcon className={'h-4 w-4'} />
								<span className='text-sm leading-6 font-semibold'>企业微信</span>
							</>
						)}
						{social.icon && <span className='text-sm leading-6 font-semibold'>{social.name}</span>}
					</button>
				))}
			</div>
		</div>
	);
};
