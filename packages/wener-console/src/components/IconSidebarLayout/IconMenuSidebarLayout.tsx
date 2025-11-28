import React, { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { HeaderContentFooterLayout } from '../HeaderContentFooterLayout';
import { OverlayScrollbar } from '../OverlayScrollbar';

export const IconMenuSidebarLayout: FC<
	{
		top?: ReactNode;
		bottom?: ReactNode;
		center?: ReactNode;
	} & ComponentPropsWithoutRef<'aside'>
> = ({ top, bottom, children, center = children, className, ...props }) => {
	return (
		<HeaderContentFooterLayout
			as={'aside'}
			className={cn(
				'border-base-300 order-0 flex flex-row',
				// 手机
				'h-[57px] w-full border-b px-2',
				// 桌面
				'md:h-full md:w-[57px] md:flex-col md:border-r md:px-0',
				//
				className,
			)}
			header={<div className={'border-base-300 flex items-center justify-center gap-1 py-1 md:border-b'}>{top}</div>}
			footer={<div className={'border-base-300 flex items-center justify-center gap-1 py-1 md:border-t'}>{bottom}</div>}
			{...props}
		>
			<OverlayScrollbar className={'h-full w-full'}>
				<div
					className={cn(
						// 8px padding
						'flex items-center gap-1 px-1 py-1',
						'flex-row',
						'md:flex-col',
						// 'overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto',
					)}
				>
					{center}
				</div>
			</OverlayScrollbar>
		</HeaderContentFooterLayout>
	);
};
