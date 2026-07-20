import { FloatingFocusManager, FloatingPortal } from '@floating-ui/react';
import React, { memo } from 'react';
import { PiBrowser } from 'react-icons/pi';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/vanilla/shallow';
import { usePopover } from '../../floating';
import { cn } from '../../utils/cn';
import { getRootWindow, type ReactWindow } from '../ReactWindow';

const WindowDockItem = memo<{ win: ReactWindow }>(({ win }) => {
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
export const WindowDockList = memo(() => {
	const windows = useStore(
		getRootWindow().store,
		useShallow((s) => s.windows),
	);
	return (
		<div className={'flex h-full flex-row items-center gap-0.5 md:flex-col'}>
			{windows.map((win) => {
				return <WindowDockItem key={win.id} win={win} />;
			})}
		</div>
	);
});
