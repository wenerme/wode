import React, { ComponentPropsWithRef } from 'react';
import { mutative } from '@wener/reaction/mutative/zustand';
import { computeIfAbsent } from '@wener/utils';
import { createStore, useStore } from 'zustand';
import { getGlobalStates } from '@/state';
import { MacOSWindowController } from '@/web/window/MacOS';
import { WindowsWindowController } from '@/web/window/Windows';

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

interface WindowStyleState {
  theme?: 'macos' | 'windows' | 'system';
}

export function getWindowStyleStore(): WindowStyleStore {
  return computeIfAbsent(getGlobalStates(), 'WindowStyleStore', createWindowStyleStore);
}

function createWindowStyleStore() {
  return createStore(
    mutative<WindowStyleState>(() => {
      return {
        theme: 'system',
      };
    }),
  );
}

type WindowStyleStore = ReturnType<typeof createWindowStyleStore>;

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
