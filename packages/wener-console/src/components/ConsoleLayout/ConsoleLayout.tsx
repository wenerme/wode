import React, { type ReactElement, type ReactNode } from 'react';
import { WindowDock } from '../../window/WindowDock';
import { IconSidebarLayout } from '../IconSidebarLayout/IconSidebarLayout';

export namespace ConsoleLayout {
	export const Composite = ({
		children,
		dock = true,
		menu,
	}: {
		children?: ReactNode;
		dock?: boolean | ReactElement | WindowDock.DockProps;
		menu?: Pick<IconSidebarLayout.LayoutProps, 'top' | 'bottom' | 'center'>;
	}) => {
		let content = children;
		if (!dock) {
			// disable
		} else if (dock === true) {
			content = <WindowDock.Layout>{children}</WindowDock.Layout>;
		} else if (React.isValidElement(dock)) {
			content = <WindowDock.Layout dock={dock}>{children}</WindowDock.Layout>;
		} else {
			content = <WindowDock.Layout dock={<WindowDock.Dock {...dock} />}>{children}</WindowDock.Layout>;
		}

		return <IconSidebarLayout.Layout {...menu}>{content}</IconSidebarLayout.Layout>;
	};
}
