import { useStore } from 'zustand';
import { getWindowStyleStore } from './WindowStyleStore';

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
