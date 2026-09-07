import { useInterval } from '@wener/reaction';
import dayjs from 'dayjs';
import { type ComponentPropsWithRef, type ReactNode, useMemo, useState } from 'react';
import { cn } from '../utils/cn';
import { WindowControlButton } from './standalone/WindowControlButton';
import { WindowDockList } from './standalone/WindowDockList';

export namespace WindowDock {
	const ControlButton = WindowControlButton;

	export type DockProps = DockLayoutProps;

	export const Dock = ({
		header = (
			<>
				<ControlButton />
			</>
		),
		footer = (
			<>
				<Clock />
			</>
		),
		children = <List />,
		...props
	}: DockProps) => {
		return (
			<DockLayout open header={header} footer={footer} {...props}>
				{children}
			</DockLayout>
		);
	};

	export const Layout = ({
		children,
		dock = <Dock />,
		className,
		...props
	}: ComponentPropsWithRef<'div'> & { children?: ReactNode; dock?: ReactNode }) => {
		/*
MD
 Main | Dock

SM
Dock
Main
 */

		return (
			<div className={cn('flex h-full w-full overflow-hidden', 'flex-col md:flex-row', className)} {...props}>
				<main className={'relative order-5 h-full flex-1 overflow-auto'}>
					<div className={'absolute inset-0 scrollbar-thin'}>{children}</div>
				</main>
				{dock}
			</div>
		);
	};

	export type DockLayoutProps = ComponentPropsWithRef<'div'> & {
		open?: boolean;
		header?: ReactNode;
		footer?: ReactNode;
		children?: ReactNode;
	};
	/*
MD

Header
------
Children
------
Footer

SM
Header | Children | Footer
 */

	export const DockLayout = ({ open = true, children, header, footer, className, ...props }: DockLayoutProps) => {
		return (
			<div
				className={cn(
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
					className,
				)}
				{...props}
			>
				<div className={'relative flex h-full w-full flex-1 flex-row items-center gap-1 md:flex-col'}>
					{/*<WindowControlButton />*/}
					{header}
					<div className={'relative h-full w-full flex-1'}>
						<div className={'absolute inset-0 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto'}>{children}</div>
					</div>
					{footer}
				</div>
			</div>
		);
	};
	export const List = WindowDockList;

	export const Clock = () => {
		const [date, setDate] = useState(() => dayjs());
		useInterval(() => {
			setDate(dayjs());
		}, 1000 * 60);
		const title = useMemo(
			() => new Intl.DateTimeFormat('zh-CN', { calendar: 'chinese', dateStyle: 'full' }).format(date.toDate()),
			[date.dayOfYear()],
		);

		return (
			<div className={'flex flex-col items-center self-center'} title={title}>
				<span style={{ fontSize: 10 }}>{date.format('ddd hh:mm')}</span>
				<span style={{ fontSize: 9 }}>{date.format('YYYY/MM/DD')}</span>
			</div>
		);
	};
}
