import React, { type ComponentPropsWithRef, type FC } from 'react';
import { CgCompressRight, CgExpand } from 'react-icons/cg';
import { HiMiniMinus, HiMiniXMark } from 'react-icons/hi2';
import styled from '@emotion/styled';
import { clsx } from 'clsx';
import { getWindowDragCancelClassname } from '../const';

const WindowController = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;

	& > button > svg {
		opacity: 0;
	}

	& > button > svg:hover {
		opacity: 0.65;
	}

	& > button {
		height: 1rem;
		width: 1rem;
		border-radius: 9999px;
		background-color: rgb(209 213 219);
		--color: var(--color-gray-300);

		&:disabled {
			opacity: 0.45;
			--color: #000 !important;
		}

		&[data-action='close'] {
			--color: #f34f4f;
		}

		&[data-action='minimize'] {
			--color: #f3b95d;
		}

		&[data-action='maximize'] {
			--color: #3ab54a;
		}
	}

	.group\\/window:focus-within & > button {
		background-color: var(--color) !important;
	}

	.group\\/window:hover & > button {
		background-color: var(--color) !important;
	}
`;

export const MacOSWindowController: FC<{
	close?: ComponentPropsWithRef<'button'>;
	minimize?: ComponentPropsWithRef<'button'>;
	maximize?: ComponentPropsWithRef<'button'>;
}> = ({ close, minimize, maximize }) => {
	const className = 'group-focus-within/window:bg-(color:--color)! group-hover/window:bg-(color:--color)!';
	return (
		<WindowController className={clsx(`${getWindowDragCancelClassname()} group/actions`, 'WindowController')}>
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
		</WindowController>
	);
};
