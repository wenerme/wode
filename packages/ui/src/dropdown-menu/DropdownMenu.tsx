import { Menu as BaseMenu } from '@base-ui/react/menu';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const DropdownMenuRoot = BaseMenu.Root;
export const DropdownMenuTrigger = BaseMenu.Trigger;
export const DropdownMenuGroup = BaseMenu.Group;
export const DropdownMenuRadioGroup = BaseMenu.RadioGroup;
export const DropdownMenuSub = BaseMenu.SubmenuRoot;

export type DropdownMenuContentProps = ComponentPropsWithRef<typeof BaseMenu.Popup> & {
	positionerProps?: ComponentPropsWithRef<typeof BaseMenu.Positioner>;
};

export function DropdownMenuContent({ className, positionerProps, ...props }: DropdownMenuContentProps) {
	return (
		<BaseMenu.Portal>
			<BaseMenu.Positioner sideOffset={6} {...positionerProps}>
				<BaseMenu.Popup
					data-slot='dropdown-menu-content'
					className={cn(
						'menu border-base-300 bg-base-100 text-base-content rounded-box z-50 max-h-[var(--available-height)] min-w-48 overflow-y-auto overscroll-contain border p-1 shadow-lg outline-none',
						'transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none',
						className,
					)}
					{...props}
				/>
			</BaseMenu.Positioner>
		</BaseMenu.Portal>
	);
}

const itemClasses =
	'rounded-field data-highlighted:bg-base-200 data-highlighted:text-base-content flex cursor-default items-center gap-2 px-3 py-2 text-sm outline-none data-disabled:opacity-40';

export type DropdownMenuItemProps = ComponentPropsWithRef<typeof BaseMenu.Item>;

export function DropdownMenuItem({ className, ...props }: DropdownMenuItemProps) {
	return <BaseMenu.Item data-slot='dropdown-menu-item' className={cn(itemClasses, className)} {...props} />;
}

export type DropdownMenuCheckboxItemProps = ComponentPropsWithRef<typeof BaseMenu.CheckboxItem>;

export function DropdownMenuCheckboxItem({ className, ...props }: DropdownMenuCheckboxItemProps) {
	return (
		<BaseMenu.CheckboxItem data-slot='dropdown-menu-checkbox-item' className={cn(itemClasses, className)} {...props} />
	);
}

export type DropdownMenuRadioItemProps = ComponentPropsWithRef<typeof BaseMenu.RadioItem>;

export function DropdownMenuRadioItem({ className, ...props }: DropdownMenuRadioItemProps) {
	return <BaseMenu.RadioItem data-slot='dropdown-menu-radio-item' className={cn(itemClasses, className)} {...props} />;
}

export type DropdownMenuLabelProps = ComponentPropsWithRef<typeof BaseMenu.GroupLabel>;

export function DropdownMenuLabel({ className, ...props }: DropdownMenuLabelProps) {
	return (
		<BaseMenu.GroupLabel
			data-slot='dropdown-menu-label'
			className={cn('text-base-content/65 px-3 py-2 text-xs font-semibold', className)}
			{...props}
		/>
	);
}

export type DropdownMenuSeparatorProps = ComponentPropsWithRef<'div'>;

export function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps) {
	return <div data-slot='dropdown-menu-separator' className={cn('bg-base-300 my-1 h-px', className)} {...props} />;
}

export type DropdownMenuSubTriggerProps = ComponentPropsWithRef<typeof BaseMenu.SubmenuTrigger>;

export function DropdownMenuSubTrigger({ className, ...props }: DropdownMenuSubTriggerProps) {
	return (
		<BaseMenu.SubmenuTrigger data-slot='dropdown-menu-sub-trigger' className={cn(itemClasses, className)} {...props} />
	);
}

export type DropdownMenuSubContentProps = DropdownMenuContentProps;

export function DropdownMenuSubContent(props: DropdownMenuSubContentProps) {
	return <DropdownMenuContent data-slot='dropdown-menu-sub-content' {...props} />;
}

export const DropdownMenuCheckboxItemIndicator = BaseMenu.CheckboxItemIndicator;
export const DropdownMenuRadioItemIndicator = BaseMenu.RadioItemIndicator;
export const DropdownMenuArrow = BaseMenu.Arrow;

export const DropdownMenu = {
	Root: DropdownMenuRoot,
	Trigger: DropdownMenuTrigger,
	Content: DropdownMenuContent,
	Group: DropdownMenuGroup,
	Label: DropdownMenuLabel,
	Item: DropdownMenuItem,
	CheckboxItem: DropdownMenuCheckboxItem,
	CheckboxItemIndicator: DropdownMenuCheckboxItemIndicator,
	RadioGroup: DropdownMenuRadioGroup,
	RadioItem: DropdownMenuRadioItem,
	RadioItemIndicator: DropdownMenuRadioItemIndicator,
	Separator: DropdownMenuSeparator,
	Sub: DropdownMenuSub,
	SubTrigger: DropdownMenuSubTrigger,
	SubContent: DropdownMenuSubContent,
	Arrow: DropdownMenuArrow,
};
