import React, { ComponentPropsWithRef } from 'react';
import { useStore } from 'zustand';
import { MacOSWindowController } from '@/web/window/MacOS';
import { WindowsWindowController } from '@/web/window/Windows';
import { getWindowStyleStore } from '@/web/window/WindowStyleStore';

export const WindowController: React.FC<{
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

export function useWindowTheme() {
  const theme = useStore(getWindowStyleStore(), (s) => s.theme);
  if (theme && theme !== 'system') {
    return theme;
  }

  let ua = navigator.userAgent;
  if (ua.indexOf('Win') !== -1) {
    return 'windows';
  } else if (ua.indexOf('Mac') !== -1) {
    return 'macos';
  }

  // if (ua.indexOf('Linux') !== -1 || ua.indexOf('X11') !== -1) {
  //   return 'linux';
  // } else {
  //   return 'unknown';
  // }
  return 'macos';
}
