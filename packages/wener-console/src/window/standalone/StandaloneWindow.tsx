import { DevOnly, useControllable } from '@wener/reaction';
import { type ReactNode, useEffect, useRef } from 'react';
import { PiCaretLeftLight, PiCaretRightLight } from 'react-icons/pi';
import { Window, WindowDock } from '..';

export const StandaloneWindow = ({
	open: _open,
	onOpenChange: _onOpenChange,
	children,
	controller,
	body,
}: {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: ReactNode;
	controller?: ReactNode;
	body?: HTMLElement;
}) => {
	const initialRef = useRef(true);
	const [open, setOpen] = useControllable(_open, _onOpenChange, false);

	useEffect(() => {
		if (initialRef.current) return;
		return Window.getRoot().store.subscribe((s) => {
			if (s.windows.length && !initialRef.current) {
				initialRef.current = true;
				setOpen(true);
			}
		});
	}, []);
	return (
		<>
			<Window.Host body={body} />
			<WindowDock.Dock open={open} />

			{controller ?? (
				<div
					className={
						'bg-base-100 fixed right-1.5 bottom-4 flex flex-col gap-2 overflow-hidden rounded-full border px-1 py-1 shadow-lg'
					}
				>
					<button
						type={'button'}
						className={'btn btn-circle btn-sm'}
						onClick={() => {
							setOpen(!open);
						}}
					>
						{open ? <PiCaretRightLight /> : <PiCaretLeftLight />}
					</button>
					{children}
					<DevOnly>
						<button
							type={'button'}
							className={'btn btn-circle btn-sm'}
							onClick={() => {
								Window.open({
									title: 'Test',
									render: () => {
										return <div>Hello</div>;
									},
								});
							}}
						>
							Test
						</button>
					</DevOnly>
				</div>
			)}
		</>
	);
};
