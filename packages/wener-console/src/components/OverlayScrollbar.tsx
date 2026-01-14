import { OverlayScrollbarsComponent, type OverlayScrollbarsComponentProps } from 'overlayscrollbars-react';

type OverlayScrollbarProps = OverlayScrollbarsComponentProps & {};

export const OverlayScrollbar = ({ children, ...props }: OverlayScrollbarProps) => {
	return (
		<OverlayScrollbarsComponent
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
		</OverlayScrollbarsComponent>
	);
};
OverlayScrollbar.displayName = 'OverlayScrollbar';
