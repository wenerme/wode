import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export type FieldsetProps = ComponentPropsWithRef<typeof BaseFieldset.Root>;

export function Fieldset({ className, ...props }: FieldsetProps) {
	return <BaseFieldset.Root data-slot='fieldset' className={cn('fieldset', className)} {...props} />;
}

export type FieldsetLegendProps = ComponentPropsWithRef<typeof BaseFieldset.Legend>;

export function FieldsetLegend({ className, ...props }: FieldsetLegendProps) {
	return <BaseFieldset.Legend data-slot='fieldset-legend' className={cn('fieldset-legend', className)} {...props} />;
}

export const FieldsetCompound = {
	Root: Fieldset,
	Legend: FieldsetLegend,
};
