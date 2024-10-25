import React, { type ComponentPropsWithRef, type FC } from 'react';
import { CgExpand } from 'react-icons/cg';
import { HiMiniMinus, HiMiniXMark } from 'react-icons/hi2';
import { clsx } from 'clsx';
import { getWindowDragCancelClassname } from '../const';
import styles from './macOS.module.css';

export const MacOSWindowController: FC<{
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
