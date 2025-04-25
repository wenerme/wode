import React, { type ComponentPropsWithRef, type FC } from 'react';
import { CgCompressRight, CgExpand } from 'react-icons/cg';
import { HiMiniMinus, HiMiniXMark } from 'react-icons/hi2';
import { clsx } from 'clsx';
import { getWindowDragCancelClassname } from '../const';
import styles from './macOS.module.css';

export const MacOSWindowController: FC<{
	close?: ComponentPropsWithRef<'button'>;
	minimize?: ComponentPropsWithRef<'button'>;
	maximize?: ComponentPropsWithRef<'button'>;
}> = ({ close, minimize, maximize }) => {
	const className = 'group-focus-within/window:bg-(color:--color)! group-hover/window:bg-(color:--color)!';
	return (
		<div className={clsx(`${getWindowDragCancelClassname()} group/actions`, styles.WindowController)}>
			<button type={'button'} data-action={'close'} className={className} {...close}>
				<HiMiniXMark />
			</button>
			<button type={'button'} data-action={'minimize'} className={className} {...minimize}>
				<HiMiniMinus />
			</button>
			<button type={'button'} data-action={'maximize'} className={clsx(className, 'group/btn')} {...maximize}>
				<CgExpand className={'block group-data-active/btn:hidden'} />
				<CgCompressRight className={'hidden p-[3px] group-data-active/btn:block'} />
			</button>
		</div>
	);
};
