import React, { type ComponentPropsWithRef, type FC } from 'react';
import { PiMinusThin, PiSquareThin, PiXThin } from 'react-icons/pi';
import styled from '@emotion/styled';
import { clsx } from 'clsx';
import { getWindowDragCancelClassname } from '../const';

const WindowController = styled.div`
	display: flex;
	height: 100%;

	& > button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 42px;

		&[data-action='close']:hover {
			background-color: var(--color-error);
		}

		&:hover {
			background-color: var(--color-base-300);
		}
	}
`;

export const WindowsWindowController: FC<{
	close?: ComponentPropsWithRef<'button'>;
	minimize?: ComponentPropsWithRef<'button'>;
	maximize?: ComponentPropsWithRef<'button'>;
}> = ({ close, minimize, maximize }) => {
	return (
		<WindowController className={clsx('WindowController', getWindowDragCancelClassname())}>
			<button type={'button'} data-action={'minimize'} {...minimize}>
				<PiMinusThin />
			</button>
			<button type={'button'} data-action={'maximize'} {...maximize}>
				<PiSquareThin />
			</button>
			<button type={'button'} data-action={'close'} {...close}>
				<PiXThin />
			</button>
		</WindowController>
	);
};
