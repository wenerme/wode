import React, { type ComponentPropsWithRef, type ReactNode } from 'react';
import { MacOSWindowFrame } from './macos/MacOSWindowFrame';
import { useWindowTheme } from './useWindowTheme';
import { WindowsWindowFrame } from './windows/WindowsWindowFrame';

export type WindowFrameProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
	icon?: ReactNode;
	title?: ReactNode;
	controller?: ReactNode;
	onToggleMaximize?: () => void;
};

export const WindowFrame = ({ ref, ...props }: WindowFrameProps) => {
	let theme = useWindowTheme();
	if (theme === 'macos') {
		return <MacOSWindowFrame ref={ref} {...props} />;
	}
	return <WindowsWindowFrame ref={ref} {...props} />;
};
