import React from 'react';
import { cn } from '../../utils/cn';
import { getWindowDragHandleClassname } from '../const';
import type { WindowFrameProps } from '../WindowFrame';
import { MacOSWindowController } from './MacOSWindowController';

export const MacOSWindowFrame = ({
	className,
	controller,
	title,
	children,
	onToggleMaximize,
	ref,
	...props
}: WindowFrameProps) => {
	return (
		<div
			className={cn(
				'group/window flex flex-col',
				'border-color rounded border shadow',
				'focus-within:shadow-lg',
				'bg-base-100',
				'outline-none',
				className,
			)}
			tabIndex={-1}
			ref={ref}
			{...props}
		>
			<header
				className={`${getWindowDragHandleClassname()} bg-base-200 flex h-7 cursor-default items-center justify-between px-1.5`}
				onDoubleClick={() => {
					onToggleMaximize?.();
				}}
			>
				{controller ?? <MacOSWindowController />}
				<h4 className={'flex-1 truncate px-1 text-center leading-7'}>{title}</h4>
				{/* 占位，保持标题居中 */}
				<div className={'w-16'}></div>
			</header>
			{children}
		</div>
	);
};
