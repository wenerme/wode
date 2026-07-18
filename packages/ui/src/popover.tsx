import { Popover as BasePopover } from '@base-ui/react/popover';
import type { ComponentPropsWithRef } from 'react';
import { cn } from './utils';

export const PopoverRoot = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;
export const PopoverClose = BasePopover.Close;
export const PopoverTitle = BasePopover.Title;
export const PopoverDescription = BasePopover.Description;
export const PopoverPortal = BasePopover.Portal;
export const PopoverArrow = BasePopover.Arrow;

export type PopoverContentProps = ComponentPropsWithRef<typeof BasePopover.Popup> & {
	positionerProps?: ComponentPropsWithRef<typeof BasePopover.Positioner>;
};

export function PopoverContent({ className, positionerProps, ...props }: PopoverContentProps) {
	return (
		<BasePopover.Portal>
			<BasePopover.Positioner sideOffset={8} {...positionerProps}>
				<BasePopover.Popup
					className={cn(
						'bg-popover text-popover-foreground z-50 w-72 rounded-md border p-4 shadow-md outline-none',
						className,
					)}
					{...props}
				/>
			</BasePopover.Positioner>
		</BasePopover.Portal>
	);
}

export const Popover = {
	Root: PopoverRoot,
	Trigger: PopoverTrigger,
	Portal: PopoverPortal,
	Content: PopoverContent,
	Arrow: PopoverArrow,
	Title: PopoverTitle,
	Description: PopoverDescription,
	Close: PopoverClose,
};
