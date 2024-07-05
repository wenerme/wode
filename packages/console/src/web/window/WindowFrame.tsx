import React, { ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react';
import { MacOSWindowFrame } from '@/web/window/MacOS';
import { useWindowTheme } from '@/web/window/Window';
import { WindowsWindowFrame } from '@/web/window/Windows';

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
