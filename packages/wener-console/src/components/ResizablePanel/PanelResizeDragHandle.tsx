import { clsx } from 'clsx';
import { Separator, type SeparatorProps } from 'react-resizable-panels';
import styles from './PanelResizeDragHandle.module.css';

export function PanelResizeDragHandle({ className, ...props }: SeparatorProps) {
	return (
		<Separator
			className={clsx(styles.handle, 'data-[separator=inactive]:opacity-20', className)}
			style={{
				'--size': '1rem',
			}}
			{...props}
		>
			<div>
				<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='#adadad'>
					<path strokeLinecap='round' strokeLinejoin='round' d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5' />
				</svg>
			</div>
		</Separator>
	);
}
