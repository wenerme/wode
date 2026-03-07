import { clsx } from 'clsx';
import type React from 'react';
import { WindowControlButton } from './WindowControlButton';
import { WindowDockList } from './WindowDockList';

export const StandaloneDockSidebar: React.FC<{ open?: boolean }> = ({ open }) => {
	return (
		<aside
			className={clsx(
				'fixed',
				'bg-base-100',
				//
				'flex items-center',
				'order-1 border-b px-2',
				// small
				'h-[57px] w-full border-b',
				open ? 'top-0' : '-top-40',
				'transition-[top,right]',
				// md
				'md:top-0 md:py-4',
				open ? 'md:right-0' : 'md:-right-40',
				'md:order-6 md:h-full md:w-[57px] md:flex-col md:border-b-0 md:border-l md:px-0',
			)}
		>
			<div className={'relative flex h-full w-full flex-1 flex-row items-center gap-1 md:flex-col'}>
				<WindowControlButton />
				<div className={'relative h-full w-full flex-1'}>
					<div className={'absolute inset-0 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto'}>
						<WindowDockList />
					</div>
				</div>
			</div>
		</aside>
	);
};
