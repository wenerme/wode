import React, { type FC } from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { cn } from '@wener/console';

export const DaisyDrawerTrigger = Dialog.Trigger;
export const DaisyDrawerRoot = Dialog.Root;
export const DaisyDrawerPortal = Dialog.Portal;

type OverlayProps = React.ComponentProps<typeof Dialog.Backdrop> & {};
export const DaisyDrawerOverlay: FC<OverlayProps> = ({ children, className, ...props }) => {
	return (
		<Dialog.Backdrop className={'bg-base-300 fixed inset-0 z-30 opacity-75'} {...props}>
			{children}
		</Dialog.Backdrop>
	);
};

export type DaisyDrawerContentProps = React.ComponentProps<typeof Dialog.Popup> & {};
export const DaisyDrawerContent: FC<DaisyDrawerContentProps> = ({ className, children, ...props }) => {
	return (
		<Dialog.Popup className={cn('bg-base-100 fixed right-0 z-30 h-full w-56 border-l', className)} {...props}>
			{children}
		</Dialog.Popup>
	);
};

type TitleProps = React.ComponentProps<typeof Dialog.Title> & {};
export const DaisyDrawerTitle: FC<TitleProps> = ({ children, className, ...props }) => {
	return (
		<Dialog.Title className={cn(className, 'p-2 text-lg font-medium')} {...props}>
			{children}
		</Dialog.Title>
	);
};

type DescriptionProps = React.ComponentProps<typeof Dialog.Description> & {};
export const DaisyDrawerDescription: FC<DescriptionProps> = ({ children, ...props }) => {
	return <Dialog.Description {...props}>{children}</Dialog.Description>;
};

export const DaisyDrawer = {
	Trigger: DaisyDrawerTrigger,
	Root: DaisyDrawerRoot,
	Portal: DaisyDrawerPortal,
	Overlay: DaisyDrawerOverlay,
	Content: DaisyDrawerContent,
	Title: DaisyDrawerTitle,
	Description: DaisyDrawerDescription,
} as const;
