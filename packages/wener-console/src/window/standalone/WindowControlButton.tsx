import React, { memo, useMemo, type ComponentPropsWithoutRef } from 'react';
import { HiMiniArrowsPointingIn } from 'react-icons/hi2';
import { PiBrowsersLight } from 'react-icons/pi';
import { VscClose, VscCloseAll, VscPrimitiveSquare } from 'react-icons/vsc';
import { FloatingFocusManager, useTransitionStyles } from '@floating-ui/react';
import { usePopover } from '../../floating';
import { getRootWindow } from '../ReactWindow';
import { Window } from '../Window';

const WindowControlPopoverContent: React.FC<ComponentPropsWithoutRef<'ul'>> = (props) => {
	const root = getRootWindow();
	// 避免单次操作内 layout 发生变化
	const top = useMemo(() => root.top, []);
	const count = root.windows.length;
	return (
		<ul className={'border-color menu menu-sm rounded-box bg-base-100 w-44 border'} {...props}>
			{top && (
				<>
					<li className='menu-title'>当前窗口</li>
					<li>
						<a
							onClick={() => {
								top.close();
							}}
						>
							<VscClose />
							关闭
						</a>
					</li>
					<li>
						<a
							onClick={() => {
								top.center();
							}}
						>
							<VscPrimitiveSquare />
							居中
						</a>
					</li>
				</>
			)}
			<li className='menu-title'>窗口管理 ({count})</li>
			<li>
				<a
					onClick={() => {
						Window.closeAll();
					}}
				>
					<VscCloseAll />
					关闭所有窗口
				</a>
			</li>
			<li>
				<a
					onClick={() => {
						Window.minimizeAll();
					}}
				>
					<HiMiniArrowsPointingIn />
					最小化所有窗口
				</a>
			</li>
		</ul>
	);
};
export const WindowControlButton = memo(() => {
	const { refs, getFloatingProps, getReferenceProps, open, setOpen, floatingStyles, context, nodeId } = usePopover({
		placement: 'left-start',
	});
	const { isMounted, styles } = useTransitionStyles(context, {
		initial: {
			opacity: 0,
			transform: 'translateY(-10px)',
		},
		close: {
			opacity: 0,
			transform: 'translateY(10px)',
		},
	});
	return (
		<>
			<button
				type={'button'}
				className={'btn btn-square btn-ghost btn-sm self-center'}
				ref={refs.setReference}
				{...getReferenceProps()}
			>
				<PiBrowsersLight className={'h-5 w-5 opacity-75'} />
			</button>
			{isMounted && (
				<FloatingFocusManager context={context}>
					<div ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles} className={'z-50'}>
						<WindowControlPopoverContent
							style={styles}
							onClick={() => {
								setOpen(false);
							}}
						/>
					</div>
				</FloatingFocusManager>
			)}
		</>
	);
});
