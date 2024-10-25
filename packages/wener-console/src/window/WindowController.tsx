import React, { type ComponentPropsWithRef, type FC } from 'react';
import { MacOSWindowController } from './macos/MacOSWindowController';
import { useWindowTheme } from './useWindowTheme';
import { WindowsWindowController } from './windows/WindowsWindowController';

export const WindowController: FC<{
  close?: ComponentPropsWithRef<'button'>;
  minimize?: ComponentPropsWithRef<'button'>;
  maximize?: ComponentPropsWithRef<'button'>;
}> = (props) => {
  let theme = useWindowTheme();
  if (theme === 'macos') {
    return <MacOSWindowController {...props} />;
  }
  return <WindowsWindowController {...props} />;
};
