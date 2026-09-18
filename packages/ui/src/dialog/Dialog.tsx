import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const DialogRoot = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;
export const DialogTitle = BaseDialog.Title;
export const DialogDescription = BaseDialog.Description;
export const DialogPortal = BaseDialog.Portal;

export type DialogBackdropProps = ComponentPropsWithRef<typeof BaseDialog.Backdrop>;
export type DialogContentProps = ComponentPropsWithRef<typeof BaseDialog.Popup>;

export function DialogBackdrop({ className, ...props }: DialogBackdropProps) {
	return (
		<BaseDialog.Backdrop
			data-slot='dialog-backdrop'
			className={cn(
				'bg-base-content/40 fixed inset-0 z-50 transition-opacity duration-150',
				'data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none',
				className,
			)}
			{...props}
		/>
	);
}

export function DialogContent({ className, ...props }: DialogContentProps) {
	return (
		<BaseDialog.Portal>
			<DialogBackdrop />
			<BaseDialog.Popup
				data-slot='dialog-content'
				className={cn(
					'border-base-300 bg-base-100 text-base-content rounded-box fixed top-1/2 left-1/2 z-50 grid w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border p-6 shadow-lg',
					'transition-[opacity,scale] duration-150 focus-visible:outline-none',
					'data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none',
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
