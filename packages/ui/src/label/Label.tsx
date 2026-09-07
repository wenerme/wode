import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export type LabelProps = ComponentPropsWithRef<'label'>;

export function Label({ className, ...props }: LabelProps) {
	return <label data-slot='label' className={cn('label', className)} {...props} />;
}

export type FloatingLabelProps = ComponentPropsWithRef<'label'>;

export function FloatingLabel({ className, ...props }: FloatingLabelProps) {
	return <label data-slot='floating-label' className={cn('floating-label', className)} {...props} />;
}
