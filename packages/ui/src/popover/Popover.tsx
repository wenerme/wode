import { Popover as BasePopover } from '@base-ui/react/popover';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

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
					data-slot='popover-content'
					className={cn(
						'border-base-300 bg-base-100 text-base-content rounded-box z-50 w-72 border p-4 shadow-md outline-none',
						'transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none',
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
