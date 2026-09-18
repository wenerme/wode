import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const SheetRoot = BaseDialog.Root;
export const SheetTrigger = BaseDialog.Trigger;
export const SheetClose = BaseDialog.Close;
export const SheetTitle = BaseDialog.Title;
export const SheetDescription = BaseDialog.Description;

export const sheetVariants = cva(
	'border-base-300 bg-base-100 text-base-content fixed z-50 flex max-h-dvh flex-col gap-4 overflow-y-auto overscroll-contain border p-6 shadow-xl outline-none transition-transform duration-200 motion-reduce:transition-none',
	{
		variants: {
			side: {
				top: 'inset-x-0 top-0 border-b data-ending-style:-translate-y-full data-starting-style:-translate-y-full',
				right:
					'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-ending-style:translate-x-full data-starting-style:translate-x-full',
				bottom: 'inset-x-0 bottom-0 border-t data-ending-style:translate-y-full data-starting-style:translate-y-full',
				left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-ending-style:-translate-x-full data-starting-style:-translate-x-full',
			},
		},
		defaultVariants: {
			side: 'right',
		},
	},
);

export type SheetContentProps = ComponentPropsWithRef<typeof BaseDialog.Popup> & VariantProps<typeof sheetVariants>;

export function SheetContent({ className, side, ...props }: SheetContentProps) {
	return (
		<BaseDialog.Portal>
			<BaseDialog.Backdrop
				data-slot='sheet-backdrop'
				className='bg-base-content/40 fixed inset-0 z-50 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none'
			/>
			<BaseDialog.Popup data-slot='sheet-content' className={cn(sheetVariants({ side }), className)} {...props} />
		</BaseDialog.Portal>
	);
}

export type SheetHeaderProps = ComponentPropsWithRef<'div'>;

export function SheetHeader({ className, ...props }: SheetHeaderProps) {
	return <div data-slot='sheet-header' className={cn('grid gap-2', className)} {...props} />;
}

export type SheetFooterProps = ComponentPropsWithRef<'div'>;

export function SheetFooter({ className, ...props }: SheetFooterProps) {
	return <div data-slot='sheet-footer' className={cn('mt-auto flex justify-end gap-2', className)} {...props} />;
}

export const Sheet = {
	Root: SheetRoot,
	Trigger: SheetTrigger,
	Content: SheetContent,
	Header: SheetHeader,
	Footer: SheetFooter,
	Title: SheetTitle,
	Description: SheetDescription,
	Close: SheetClose,
};
