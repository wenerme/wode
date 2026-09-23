import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../utils';

export type DiffProps = ComponentPropsWithRef<'figure'>;
export type DiffItemProps = ComponentPropsWithRef<'div'>;
export type DiffResizerProps = ComponentPropsWithRef<'div'>;

function DiffRoot({ className, tabIndex = 0, ...props }: DiffProps) {
	return <figure {...props} className={cn('diff', className)} data-slot='diff' tabIndex={tabIndex} />;
}

function DiffItem1({ className, role = 'img', tabIndex = 0, ...props }: DiffItemProps) {
	return (
		<div {...props} className={cn('diff-item-1', className)} data-slot='diff-item-1' role={role} tabIndex={tabIndex} />
	);
}

function DiffItem2({ className, role = 'img', ...props }: DiffItemProps) {
	return <div {...props} className={cn('diff-item-2', className)} data-slot='diff-item-2' role={role} />;
}

function DiffResizer({ className, ...props }: DiffResizerProps) {
	return <div {...props} className={cn('diff-resizer', className)} data-slot='diff-resizer' />;
}

export const Diff = Object.assign(DiffRoot, {
	Item1: DiffItem1,
	Item2: DiffItem2,
	Resizer: DiffResizer,
});
