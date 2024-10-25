import React, { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { MacOSWindowFrame } from './macos/MacOSWindowFrame';
import { useWindowTheme } from './useWindowTheme';
import { WindowsWindowFrame } from './windows/WindowsWindowFrame';

export type WindowFrameProps = Omit<ComponentPropsWithoutRef<'div'>, 'title'> & {
  icon?: ReactNode;
  title?: ReactNode;
  controller?: ReactNode;
  onToggleMaximize?: () => void;
};

export const WindowFrame = forwardRef<HTMLDivElement, WindowFrameProps>(({ ...props }, ref) => {
  // 组件样式可参考 https://reactdesktop.js.org/
  let theme = useWindowTheme();
  if (theme === 'macos') {
    return <MacOSWindowFrame ref={ref} {...props} />;
  }
  return <WindowsWindowFrame ref={ref} {...props} />;
});
