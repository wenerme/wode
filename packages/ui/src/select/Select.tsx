import { Select as BaseSelect } from '@base-ui/react/select';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const SelectRoot = BaseSelect.Root;
export const SelectValue = BaseSelect.Value;
export const SelectGroup = BaseSelect.Group;

export const selectTriggerVariants = cva('select w-full', {
	variants: {
		variant: {
			default: '',
			ghost: 'select-ghost',
		},
		tone: {
			default: '',
			neutral: 'select-neutral',
			primary: 'select-primary',
			secondary: 'select-secondary',
			accent: 'select-accent',
			info: 'select-info',
			success: 'select-success',
			warning: 'select-warning',
			error: 'select-error',
		},
		size: {
			xs: 'select-xs',
			sm: 'select-sm',
			md: 'select-md',
			lg: 'select-lg',
			xl: 'select-xl',
		},
	},
	defaultVariants: {
		variant: 'default',
		tone: 'default',
		size: 'md',
	},
});

export type SelectTriggerProps = ComponentPropsWithRef<typeof BaseSelect.Trigger> &
	VariantProps<typeof selectTriggerVariants>;

export function SelectTrigger({ className, variant, tone, size, ...props }: SelectTriggerProps) {
	return (
		<BaseSelect.Trigger
			data-slot='select-trigger'
			className={cn(selectTriggerVariants({ variant, tone, size }), className)}
			{...props}
		/>
	);
}

export type SelectContentProps = ComponentPropsWithRef<typeof BaseSelect.Popup> & {
	positionerProps?: ComponentPropsWithRef<typeof BaseSelect.Positioner>;
};

export function SelectContent({ className, positionerProps, ...props }: SelectContentProps) {
	return (
		<BaseSelect.Portal>
			<BaseSelect.Positioner sideOffset={6} alignItemWithTrigger={false} {...positionerProps}>
				<BaseSelect.Popup
					data-slot='select-content'
					className={cn(
						'border-base-300 bg-base-100 text-base-content rounded-box z-50 max-h-[var(--available-height)] min-w-[var(--anchor-width)] overflow-y-auto overscroll-contain border p-1 shadow-lg outline-none',
						'transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none',
						className,
					)}
					{...props}
				/>
			</BaseSelect.Positioner>
		</BaseSelect.Portal>
	);
}

export type SelectItemProps = ComponentPropsWithRef<typeof BaseSelect.Item>;

export function SelectItem({ className, ...props }: SelectItemProps) {
	return (
		<BaseSelect.Item
			data-slot='select-item'
			className={cn(
				'rounded-field data-highlighted:bg-base-200 data-selected:bg-primary data-selected:text-primary-content flex cursor-default items-center gap-2 px-3 py-2 text-sm outline-none data-disabled:opacity-40',
				className,
			)}
			{...props}
		/>
	);
}

export type SelectLabelProps = ComponentPropsWithRef<typeof BaseSelect.Label>;

export function SelectLabel({ className, ...props }: SelectLabelProps) {
	return (
		<BaseSelect.Label
			data-slot='select-label'
			className={cn('px-3 py-2 text-xs font-semibold', className)}
			{...props}
		/>
	);
}

export const SelectItemText = BaseSelect.ItemText;
export const SelectItemIndicator = BaseSelect.ItemIndicator;
export const SelectIcon = BaseSelect.Icon;
export const SelectList = BaseSelect.List;
export const SelectGroupLabel = BaseSelect.GroupLabel;

export const Select = {
	Root: SelectRoot,
	Trigger: SelectTrigger,
	Value: SelectValue,
	Content: SelectContent,
	List: SelectList,
	Group: SelectGroup,
	GroupLabel: SelectGroupLabel,
	Label: SelectLabel,
	Item: SelectItem,
	ItemText: SelectItemText,
	ItemIndicator: SelectItemIndicator,
	Icon: SelectIcon,
};
