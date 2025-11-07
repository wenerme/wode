import React, { type ReactElement, type ReactNode } from 'react';
import { IconSidebarLayout } from '../../../components/IconSidebarLayout/IconSidebarLayout';
import { WindowDock } from '../../../window/WindowDock';

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
		/*
Icon Menu | Content | Dock

Icon Menu
Top
Content
Bottom
 */

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
