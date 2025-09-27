import React, {
	memo,
	useEffect,
	type ComponentProps,
	type ComponentPropsWithoutRef,
	type FC,
	type ReactNode,
} from 'react';
import { Rnd } from 'react-rnd';
import { useEvent } from '@wener/reaction';
import { Closer } from '@wener/utils';
import { clsx } from 'clsx';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { getWindowDragCancelClassname, getWindowDragHandleClassname } from './const';
import { getRootWindow, WindowContext, type ReactWindow } from './ReactWindow';
import { WindowController } from './WindowController';
import { WindowFrame } from './WindowFrame';

export const WindowGuest = memo<{ win: ReactWindow }>(({ win }) => {
	const { store } = win;
	const {
		zIndex,
		minimized,
		x,
		y,
		width,
		height,
		canResize,
		canDrag,
		minWidth,
		minHeight,
		maxWidth,
		maxHeight,
		maximized,
	} = useStore(
		store,
		useShallow(
			({
				zIndex,
				minimized,
				x,
				y,
				width,
				height,
				canResize,
				maximized,
				canDrag,
				minWidth,
				minHeight,
				maxWidth,
				maxHeight,
			}) => {
				return {
					zIndex,
					minimized,
					maximized,
					x,
					y,
					width,
					height,
					canResize: canResize && !maximized,
					canDrag: canDrag && !maximized,
					minWidth,
					minHeight,
					maxWidth,
					maxHeight,
				};
			},
		),
	);

	// maximized should keep space for dock
	// fullscreen should cover dock

	let size = maximized
		? { width: '100vw', height: '100vh' }
		: {
				width,
				height,
			};
	let position = maximized
		? { x: 0, y: 0 }
		: {
				x,
				y,
			};
	const props: ComponentProps<typeof Rnd> = {
		id: `win-${win.id}`,
		'data-dnd-window-id': win.id,
		className: clsx(!minimized && 'pointer-events-auto', maximized && 'h-screen w-screen'),
		default: {
			x: 0,
			y: 0,
			width: 320,
			height: 200,
		},
		size: size,
		position: position,
		onDragStop: useEvent((e, d) => {
			if (!maximized) {
				store.setState({ x: d.x, y: d.y });
			}
		}),
		onResize: useEvent((e, direction, ref, delta, position) => {
			if (!maximized) {
				store.setState({
					width: ref.offsetWidth,
					height: ref.offsetHeight,
					...position,
				});
			}
		}),
		dragHandleClassName: getWindowDragHandleClassname(),
		cancel: `.${getWindowDragCancelClassname()}`,
		enableResizing: canResize,
		disableDragging: !canDrag || maximized,
		bounds: maximized ? undefined : document.body,
		minWidth: minWidth,
		minHeight: minHeight,
		maxWidth: maxWidth,
		maxHeight: maxHeight,
		style: {
			zIndex,
		},
		ref: useEvent((ref: Rnd | null) => {
			let ele = ref?.resizableElement.current;
			if (ele && win.state.windowElement !== ele) {
				win.store.setState({ windowElement: ele });
			}
		}),
	};

	return (
		<Rnd {...props}>
			<WinContent win={win} />
		</Rnd>
	);
});

const WinContent: FC<{ win: ReactWindow }> = memo(({ win }) => {
	const store = win.store;
	const [frameless] = useStore(
		store,
		useShallow(({ frameless, fullscreen }) => {
			// fullscreen always frameless
			frameless = frameless || fullscreen;
			return [frameless];
		}),
	);

	const root = getRootWindow();
	useEffect(() => {
		let closer = new Closer();
		let windowElement: HTMLElement | null | undefined;
		const handleWindowElement = (ele?: HTMLElement | null) => {
			if (!ele) {
				return;
			}
			if (ele === windowElement) {
				return;
			}

			ele.addEventListener('mousedown', () => {
				root.setActive(win);
			});
		};

		handleWindowElement(store.getState().windowElement);

		closer.add(
			store.subscribe((s) => {
				handleWindowElement(s.windowElement);
			}),
		);

		return () => {
			closer.close();
		};
	}, []);

	return (
		<WindowContext.Provider value={win}>
			{frameless ? <WinFramelessContent win={win} /> : <WinFrameContent win={win} />}
		</WindowContext.Provider>
	);
});

const WinFramelessContent: FC<{ win: ReactWindow }> = ({ win }) => {
	const store = win.store;
	const [minimized, render] = useStore(
		store,
		useShallow(({ minimized, render }) => {
			return [minimized, render];
		}),
	);
	return (
		<div
			ref={(ref) => {
				win.setBody(ref);
			}}
			className={clsx(
				'bg-base-100 @container rounded-lg shadow outline-none focus-within:shadow-lg',
				minimized && 'hidden',
			)}
			tabIndex={-1}
			inert={minimized}
			{...getWindowProps(win)}
		>
			<WindowContentRenderer render={render} />
		</div>
	);
};
const WinFrameContent: FC<{ win: ReactWindow }> = ({ win }) => {
	const store = win.store;
	const { minimized, maximized, canMinimize, canMaximize, title, render } = useStore(
		store,
		useShallow(({ minimized, maximized, canMinimize, canMaximize, title, render }) => {
			return { minimized, maximized, canMinimize, canMaximize, title, render };
		}),
	);
	return (
		<WindowFrame
			inert={minimized}
			controller={
				<WindowController
					close={{
						onClick: () => {
							win.close();
						},
					}}
					minimize={{
						disabled: !canMinimize,
						onClick: () => {
							win.minimize();
						},
					}}
					maximize={{
						disabled: !canMaximize,
						onClick: () => {
							win.maximize();
						},
						['data-active']: maximized || null,
					}}
				/>
			}
			onToggleMaximize={() => {
				win.maximize();
			}}
			className={clsx('h-full w-full', minimized && 'hidden')}
			title={title}
			{...getWindowProps(win)}
		>
			<main className={'relative flex-1 overflow-hidden'}>
				<div
					className={'@container absolute inset-0 overflow-auto outline-none'}
					ref={(ref) => {
						win.setBody(ref);
					}}
					tabIndex={-1}
				>
					<WindowContentRenderer render={render} />
				</div>
			</main>
		</WindowFrame>
	);
};

const WindowContentRenderer: FC<{ render?: () => ReactNode }> = ({ render }) => {
	return render?.();
};

function getWindowProps(win: ReactWindow): ComponentPropsWithoutRef<'div'> {
	return {};
}
