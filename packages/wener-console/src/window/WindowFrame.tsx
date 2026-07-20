import type { ComponentPropsWithRef, ReactNode } from 'react';
import { MacOSWindowFrame } from './macos/MacOSWindowFrame';
import { useWindowTheme } from './useWindowTheme';
import { WindowsWindowFrame } from './windows/WindowsWindowFrame';

export type WindowFrameProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
	icon?: ReactNode;
	title?: ReactNode;
	controller?: ReactNode;
	onToggleMaximize?: () => void;
};

export const WindowFrame = ({ ...props }: WindowFrameProps) => {
	let theme = useWindowTheme();
	if (theme === 'macos') {
		return <MacOSWindowFrame {...props} />;
	}
	return <WindowsWindowFrame {...props} />;
};
