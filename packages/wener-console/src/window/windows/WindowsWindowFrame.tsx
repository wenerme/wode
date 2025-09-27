import React from 'react';
import { PiAppWindowLight } from 'react-icons/pi';
import { cn } from '../../utils/cn';
import { getWindowDragHandleClassname } from '../const';
import type { WindowFrameProps } from '../WindowFrame';
import { WindowsWindowController } from './WindowsWindowController';

export const WindowsWindowFrame = ({
	className,
	icon,
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
				'border-color border shadow',
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
				className={`${getWindowDragHandleClassname()} bg-base-200 flex h-7 cursor-default items-center justify-between pl-2`}
				onDoubleClick={() => {
					onToggleMaximize?.();
				}}
			>
				{icon ?? <PiAppWindowLight />}
				<h4 className={'flex-1 truncate px-1 leading-7'}>{title}</h4>
				{controller ?? <WindowsWindowController />}
			</header>
			{children}
		</div>
	);
};
