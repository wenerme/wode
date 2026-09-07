import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../utils';

export const DrawerRoot = BaseDrawer.Root;
export const DrawerTrigger = BaseDrawer.Trigger;
export const DrawerClose = BaseDrawer.Close;
export const DrawerTitle = BaseDrawer.Title;
export const DrawerDescription = BaseDrawer.Description;

export type DrawerBackdropProps = ComponentPropsWithRef<typeof BaseDrawer.Backdrop>;

export function DrawerBackdrop({ className, ...props }: DrawerBackdropProps) {
	return (
		<BaseDrawer.Backdrop
			data-slot='drawer-backdrop'
			className={cn(
				'bg-base-content/40 fixed inset-0 z-50 opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-300',
				'data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0 motion-reduce:transition-none',
				className,
			)}
			{...props}
		/>
	);
}

export type DrawerContentProps = Omit<ComponentPropsWithRef<typeof BaseDrawer.Popup>, 'children'> & {
	children?: ReactNode;
	contentProps?: ComponentPropsWithRef<typeof BaseDrawer.Content>;
	viewportProps?: ComponentPropsWithRef<typeof BaseDrawer.Viewport>;
};

export function DrawerContent({ className, children, contentProps, viewportProps, ...props }: DrawerContentProps) {
	return (
		<BaseDrawer.Portal>
			<DrawerBackdrop />
			<BaseDrawer.Viewport
				data-slot='drawer-viewport'
				{...viewportProps}
				className={cn('fixed inset-0 z-50 flex items-end justify-center', viewportProps?.className)}
			>
				<BaseDrawer.Popup
					data-slot='drawer-content'
					className={cn(
						'border-base-300 bg-base-100 text-base-content rounded-t-box max-h-[85dvh] w-full overflow-y-auto border-t p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-xl outline-none',
						'[transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-300 data-ending-style:translate-y-full data-starting-style:translate-y-full data-swiping:duration-0 motion-reduce:transition-none',
						className,
					)}
					{...props}
				>
					<BaseDrawer.Content
						data-slot='drawer-inner'
						{...contentProps}
						className={cn('mx-auto w-full max-w-2xl', contentProps?.className)}
					>
						{children}
					</BaseDrawer.Content>
				</BaseDrawer.Popup>
			</BaseDrawer.Viewport>
		</BaseDrawer.Portal>
	);
}

export type DrawerHeaderProps = ComponentPropsWithRef<'div'>;

export function DrawerHeader({ className, ...props }: DrawerHeaderProps) {
	return <div data-slot='drawer-header' className={cn('grid gap-2 text-center sm:text-left', className)} {...props} />;
}

export type DrawerFooterProps = ComponentPropsWithRef<'div'>;

export function DrawerFooter({ className, ...props }: DrawerFooterProps) {
	return (
		<div
			data-slot='drawer-footer'
			className={cn('mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
			{...props}
		/>
	);
}

export const Drawer = {
	Root: DrawerRoot,
	Trigger: DrawerTrigger,
	Content: DrawerContent,
	Header: DrawerHeader,
	Footer: DrawerFooter,
	Title: DrawerTitle,
	Description: DrawerDescription,
	Close: DrawerClose,
};
