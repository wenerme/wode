import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const TooltipProvider = BaseTooltip.Provider;
export const TooltipRoot = BaseTooltip.Root;
export const TooltipTrigger = BaseTooltip.Trigger;
export const TooltipArrow = BaseTooltip.Arrow;

export type TooltipContentProps = ComponentPropsWithRef<typeof BaseTooltip.Popup> & {
	positionerProps?: ComponentPropsWithRef<typeof BaseTooltip.Positioner>;
};

export function TooltipContent({ className, positionerProps, ...props }: TooltipContentProps) {
	return (
		<BaseTooltip.Portal>
			<BaseTooltip.Positioner sideOffset={6} {...positionerProps}>
				<BaseTooltip.Popup
					data-slot='tooltip-content'
					className={cn(
						'bg-neutral text-neutral-content rounded-field z-50 max-w-72 px-2.5 py-1.5 text-xs shadow-md',
						'transition-[opacity,scale] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none',
						className,
					)}
					{...props}
				/>
			</BaseTooltip.Positioner>
		</BaseTooltip.Portal>
	);
}

export const Tooltip = {
	Provider: TooltipProvider,
	Root: TooltipRoot,
	Trigger: TooltipTrigger,
	Content: TooltipContent,
	Arrow: TooltipArrow,
};
