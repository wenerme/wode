import { OverlayScrollbarsComponent, type OverlayScrollbarsComponentProps } from 'overlayscrollbars-react';
import type { ComponentType } from 'react';

const OverlayScrollbars = OverlayScrollbarsComponent as ComponentType<any>;

type OverlayScrollbarProps = OverlayScrollbarsComponentProps & {};

export const OverlayScrollbar = ({ children, ...props }: OverlayScrollbarProps) => {
	return (
		<OverlayScrollbars
			defer
			options={{
				scrollbars: {
					visibility: 'auto',
					autoHide: 'leave',
					autoHideDelay: 1000,
					autoHideSuspend: true,
				},
			}}
			{...props}
		>
			{children}
		</OverlayScrollbars>
	);
};
OverlayScrollbar.displayName = 'OverlayScrollbar';
