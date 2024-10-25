import React, { type ComponentPropsWithRef, type FC } from 'react';
import { PiMinusThin, PiSquareThin, PiXThin } from 'react-icons/pi';
import { clsx } from 'clsx';
import { getWindowDragCancelClassname } from '../const';
import styles from './Windows.module.css';

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
