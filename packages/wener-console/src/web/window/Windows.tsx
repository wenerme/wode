import { forwardRef, type ComponentPropsWithRef, type FC } from 'react';
import { PiAppWindowLight, PiMinusThin, PiSquareThin, PiXThin } from 'react-icons/pi';
import { clsx } from 'clsx';
import { cn } from '../../tw/cn';
import { getWindowDragCancelClassname, getWindowDragHandleClassname } from './const';
import type { WindowFrameProps } from './WindowFrame';
import styles from './Windows.module.css';

export const WindowsWindowFrame = forwardRef<HTMLDivElement, WindowFrameProps>(
  ({ className, icon, controller, title, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'group/window flex flex-col',
          'border-color border shadow',
          'focus-within:shadow-lg',
          'bg-base-100',
          className,
        )}
        tabIndex={-1}
        ref={ref}
        {...props}
      >
        <header
          className={`${getWindowDragHandleClassname()} flex h-7 cursor-default items-center justify-between bg-base-200 pl-2`}
          onDoubleClick={() => {
            props.onToggleMaximize?.();
          }}
        >
          {icon ?? <PiAppWindowLight />}
          <h4 className={'flex-1 truncate px-1 leading-7'}>{title}</h4>
          {controller ?? <WindowsWindowController />}
        </header>
        {children}
      </div>
    );
  },
);

export const WindowsWindowController: FC<{
  close?: ComponentPropsWithRef<'button'>;
  minimize?: ComponentPropsWithRef<'button'>;
  maximize?: ComponentPropsWithRef<'button'>;
}> = ({ close, minimize, maximize }) => {
  return (
    <div className={clsx('WindowController', getWindowDragCancelClassname(), styles.WindowController)}>
      <button type={'button'} data-action={'minimize'} {...minimize}>
        <PiMinusThin />
      </button>
      <button type={'button'} data-action={'maximize'} {...maximize}>
        <PiSquareThin />
      </button>
      <button type={'button'} data-action={'close'} {...close}>
        <PiXThin />
      </button>
    </div>
  );
};
