import React, { ComponentPropsWithRef, forwardRef } from 'react';
import { CgExpand } from 'react-icons/cg';
import { HiMiniMinus, HiMiniXMark } from 'react-icons/hi2';
import { clsx } from 'clsx';
import { cn } from '../../lib/utils';
import { getWindowDragCancelClassname, getWindowDragHandleClassname } from './const';
import styles from './macOS.module.css';
import { WindowFrameProps } from './WindowFrame';

export const MacOSWindowFrame = forwardRef<HTMLDivElement, WindowFrameProps>(
  ({ className, controller, title, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'group/window flex flex-col',
          'border-color rounded border shadow',
          'focus-within:shadow-lg',
          'bg-base-100',
          className,
        )}
        tabIndex={-1}
        ref={ref}
        {...props}
      >
        <header
          className={`${getWindowDragHandleClassname()} flex h-7 cursor-default items-center justify-between bg-base-200 px-1.5`}
          onDoubleClick={() => {
            props.onToggleMaximize?.();
          }}
        >
          {/*<BsWindow className={'w-4 h-4'} />*/}
          {controller ?? <MacOSWindowController />}
          <h4 className={'flex-1 truncate px-1 text-center leading-7'}>{title}</h4>
          <div className={'w-16'}></div>
        </header>
        {children}
      </div>
    );
  },
);

export const MacOSWindowController: React.FC<{
  close?: ComponentPropsWithRef<'button'>;
  minimize?: ComponentPropsWithRef<'button'>;
  maximize?: ComponentPropsWithRef<'button'>;
}> = ({ close, minimize, maximize }) => {
  return (
    <div className={clsx(`${getWindowDragCancelClassname()} group/actions`, styles.WindowController)}>
      <button
        type={'button'}
        data-action={'close'}
        {...close}
        className={clsx(
          'group-focus-within/window:bg-[var(--color)] group-hover/actions:bg-[var(--color)]',
          close?.className,
        )}
      >
        <HiMiniXMark />
      </button>
      <button
        type={'button'}
        data-action={'minimize'}
        {...minimize}
        className={clsx(
          'group-focus-within/window:bg-[var(--color)] group-hover/actions:bg-[var(--color)]',
          minimize?.className,
        )}
      >
        <HiMiniMinus />
      </button>
      <button
        type={'button'}
        data-action={'maximize'}
        {...maximize}
        className={clsx(
          'group-focus-within/window:bg-[var(--color)] group-hover/actions:bg-[var(--color)]',
          maximize?.className,
        )}
      >
        <CgExpand />
      </button>
    </div>
  );
};
