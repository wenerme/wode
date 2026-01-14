import type { ComponentPropsWithRef, FC } from 'react';
import { MacOSWindowController } from './macos/MacOSWindowController';
import { useWindowTheme } from './useWindowTheme';
import { WindowsWindowController } from './windows/WindowsWindowController';

export const WindowController: FC<{
	close?: ComponentPropsWithRef<'button'> & Record<string, any>;
	minimize?: ComponentPropsWithRef<'button'> & Record<string, any>;
	maximize?: ComponentPropsWithRef<'button'> & Record<string, any>;
}> = (props) => {
	let theme = useWindowTheme();
	if (theme === 'macos') {
		return <MacOSWindowController {...props} />;
	}
	return <WindowsWindowController {...props} />;
};
