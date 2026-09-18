import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export type SkeletonProps = ComponentPropsWithRef<'div'> & {
	text?: boolean;
};

export function Skeleton({ className, text = false, ...props }: SkeletonProps) {
	return <div data-slot='skeleton' className={cn('skeleton', text && 'skeleton-text', className)} {...props} />;
}
