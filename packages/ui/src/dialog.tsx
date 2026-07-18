import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ComponentPropsWithRef } from 'react';
import { cn } from './utils';

export const DialogRoot = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;
export const DialogTitle = BaseDialog.Title;
export const DialogDescription = BaseDialog.Description;
export const DialogPortal = BaseDialog.Portal;

export type DialogBackdropProps = ComponentPropsWithRef<typeof BaseDialog.Backdrop>;
export type DialogContentProps = ComponentPropsWithRef<typeof BaseDialog.Popup>;

export function DialogBackdrop({ className, ...props }: DialogBackdropProps) {
	return <BaseDialog.Backdrop className={cn('fixed inset-0 z-50 bg-black/50', className)} {...props} />;
}

export function DialogContent({ className, ...props }: DialogContentProps) {
	return (
		<BaseDialog.Portal>
			<DialogBackdrop />
			<BaseDialog.Popup
				className={cn(
					'bg-background text-foreground fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-6 shadow-lg',
					'focus-visible:outline-none',
					className,
				)}
				{...props}
			/>
		</BaseDialog.Portal>
	);
}

export const Dialog = {
	Root: DialogRoot,
	Trigger: DialogTrigger,
	Portal: DialogPortal,
	Backdrop: DialogBackdrop,
	Content: DialogContent,
	Title: DialogTitle,
	Description: DialogDescription,
	Close: DialogClose,
};
