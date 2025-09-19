import React, { memo } from 'react';
import { PiBrowser } from 'react-icons/pi';
import { FloatingFocusManager, FloatingPortal } from '@floating-ui/react';
import { clsx } from 'clsx';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/vanilla/shallow';
import { getRootWindow, type ReactWindow } from '..';
import { usePopover } from '../../floating';
import { cn } from '../../utils/cn';
import { WindowControlButton } from './WindowControlButton';

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
						<WindowDocks />
					</div>
				</div>
			</div>
		</aside>
	);
};
const WindowDock = memo<{ win: ReactWindow }>(({ win }) => {
	const iconClass = 'w-8 h-8 ';

	const { minimized, icon, title } = useStoreWithEqualityFn(
		win.store,
		({ minimized, icon, title }) => {
			if (React.isValidElement(icon)) {
				icon = React.cloneElement(icon, {
					className: iconClass,
				} as any);
			}
			return { minimized, icon, title };
		},
		shallow,
	);
	const { refs, open, context, floatingStyles, getFloatingProps, getReferenceProps } = usePopover({
		hover: true,
		placement: 'left',
	});
	return (
		<>
			<button
				type={'button'}
				className={cn(
					'h-10 w-10',
					`text-base-content hover:text-base-content flex items-center justify-center`,
					'bg-base-200 rounded',
					!minimized ? `active bg-base-300` : 'opacity-75',
				)}
				{...getReferenceProps()}
				onClick={() => {
					win.minimize();
				}}
				ref={refs.setReference}
			>
				{icon ?? <PiBrowser className={iconClass} />}
			</button>
			{open && (
				<FloatingPortal>
					<FloatingFocusManager context={context}>
						<div
							className={'bg-base-200 rounded p-1 text-xs opacity-85'}
							ref={refs.setFloating}
							{...getFloatingProps()}
							style={floatingStyles}
						>
							{title}
						</div>
					</FloatingFocusManager>
				</FloatingPortal>
			)}
		</>
	);
});
const WindowDocks = memo(() => {
	const windows = useStore(
		getRootWindow().store,
		useShallow((s) => s.windows),
	);
	return (
		<div className={'flex h-full flex-row items-center gap-0.5 md:flex-col'}>
			{windows.map((win) => {
				return <WindowDock key={win.id} win={win} />;
			})}
		</div>
	);
});
