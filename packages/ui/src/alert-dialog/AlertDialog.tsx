import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const AlertDialogRoot = BaseAlertDialog.Root;
export const AlertDialogTrigger = BaseAlertDialog.Trigger;
export const AlertDialogClose = BaseAlertDialog.Close;
export const AlertDialogTitle = BaseAlertDialog.Title;
export const AlertDialogDescription = BaseAlertDialog.Description;

export type AlertDialogBackdropProps = ComponentPropsWithRef<typeof BaseAlertDialog.Backdrop>;

export function AlertDialogBackdrop({ className, ...props }: AlertDialogBackdropProps) {
	return (
		<BaseAlertDialog.Backdrop
			data-slot='alert-dialog-backdrop'
			className={cn(
				'bg-base-content/40 fixed inset-0 z-50 transition-opacity duration-150',
				'data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none',
				className,
			)}
			{...props}
		/>
	);
}

export type AlertDialogContentProps = ComponentPropsWithRef<typeof BaseAlertDialog.Popup>;

export function AlertDialogContent({ className, ...props }: AlertDialogContentProps) {
	return (
		<BaseAlertDialog.Portal>
			<AlertDialogBackdrop />
			<BaseAlertDialog.Popup
				data-slot='alert-dialog-content'
				className={cn(
					'border-base-300 bg-base-100 text-base-content rounded-box fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto overscroll-contain border p-6 shadow-lg outline-none',
					'transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none',
					className,
				)}
				{...props}
			/>
		</BaseAlertDialog.Portal>
	);
}

export type AlertDialogHeaderProps = ComponentPropsWithRef<'div'>;

export function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps) {
	return <div data-slot='alert-dialog-header' className={cn('grid gap-2', className)} {...props} />;
}

export type AlertDialogFooterProps = ComponentPropsWithRef<'div'>;

export function AlertDialogFooter({ className, ...props }: AlertDialogFooterProps) {
	return <div data-slot='alert-dialog-footer' className={cn('flex justify-end gap-2', className)} {...props} />;
}

export const AlertDialog = {
	Root: AlertDialogRoot,
	Trigger: AlertDialogTrigger,
	Content: AlertDialogContent,
	Header: AlertDialogHeader,
	Footer: AlertDialogFooter,
	Title: AlertDialogTitle,
	Description: AlertDialogDescription,
	Close: AlertDialogClose,
};
