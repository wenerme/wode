import { useState, type FC, type ReactNode } from 'react';
import { HiUsers } from 'react-icons/hi2';
import { clsx } from 'clsx';
import { Button } from '../../daisy';

export interface DockUserAvatarProps {
	hasNotification?: boolean;
	onSignIn?: () => void;
	onSignOut?: () => void;
	fullName?: string;
	loginName?: string;
	avatarUrl?: string;
	actions?: ReactNode;
	children?: ReactNode;
}

export const DockUserAvatar: FC<DockUserAvatarProps> = ({
	hasNotification,
	fullName,
	loginName,
	avatarUrl,
	onSignIn,
	onSignOut,
	actions,
	children,
}) => {
	const [isOpen, setIsOpen] = useState(false);

	if (!loginName) {
		return (
			<Button size={'md'} ghost circle className={'opacity-80'} onClick={onSignIn}>
				<HiUsers className={'h-6 w-6'} />
				<small className={'text-xs'}>未登录</small>
			</Button>
		);
	}

	return (
		<div className='dropdown dropdown-left dropdown-open' style={{ position: 'relative' }}>
			<div
				tabIndex={0}
				role='button'
				className={clsx(
					'btn btn-circle btn-ghost btn-sm p-0',
					'bg-base-200 ring-2 ring-stone-300',
					'h-10 w-10',
					isOpen && 'btn-active',
				)}
				onClick={() => setIsOpen(!isOpen)}
			>
				<div className={clsx('avatar', !avatarUrl && 'placeholder', hasNotification && 'online')}>
					{avatarUrl ? (
						<div className='w-10 rounded-full'>
							<img alt={fullName || 'user avatar'} src={avatarUrl} />
						</div>
					) : (
						<div className='w-10 rounded-full'>{fullName?.slice(0, 1)}</div>
					)}
				</div>
			</div>
			{isOpen && (
				<div className='absolute top-0 right-full z-10 mr-2 w-[180px]'>
					<div className='bg-base-100/50 ring-opacity-5 animate-in fade-in overflow-hidden rounded-lg p-3 shadow-lg ring-1 ring-black backdrop-blur duration-200'>
						{children}
					</div>
				</div>
			)}
		</div>
	);
};
