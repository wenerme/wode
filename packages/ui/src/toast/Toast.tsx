import { Toast as BaseToast } from '@base-ui/react/toast';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const ToastProvider = BaseToast.Provider;
export const createToastManager = BaseToast.createToastManager;
export const useToastManager = BaseToast.useToastManager;

export type ToastPortalProps = ComponentPropsWithRef<typeof BaseToast.Portal>;

export function ToastPortal(props: ToastPortalProps) {
	return <BaseToast.Portal {...props} />;
}

export type ToastViewportProps = ComponentPropsWithRef<typeof BaseToast.Viewport>;

export function ToastViewport({ className, ...props }: ToastViewportProps) {
	return (
		<BaseToast.Viewport
			data-slot='toast-viewport'
			className={cn('toast toast-end toast-bottom z-[100] w-[min(24rem,calc(100vw-2rem))] outline-none', className)}
			{...props}
		/>
	);
}

export const toastVariants = cva(
	'alert relative w-full grid-cols-1! justify-items-stretch border shadow-lg transition-[transform,opacity,height] duration-200',
	{
		variants: {
			tone: {
				default: 'border-base-300 bg-base-100 text-base-content',
				info: 'alert-info',
				success: 'alert-success',
				warning: 'alert-warning',
				error: 'alert-error',
			},
		},
		defaultVariants: {
			tone: 'default',
		},
	},
);

export type ToastRootProps = ComponentPropsWithRef<typeof BaseToast.Root> & VariantProps<typeof toastVariants>;

const toastTones = ['default', 'info', 'success', 'warning', 'error'] as const;

export type ToastTone = (typeof toastTones)[number];

function isToastTone(value: string | undefined): value is ToastTone {
	return toastTones.some((tone) => tone === value);
}

export function ToastRoot({ className, tone, toast, ...props }: ToastRootProps) {
	const resolvedTone = tone ?? (isToastTone(toast.type) ? toast.type : 'default');
	return (
		<BaseToast.Root
			data-slot='toast'
			className={cn(
				toastVariants({ tone: resolvedTone }),
				'data-ending-style:translate-y-2 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0',
				className,
			)}
			toast={toast}
			{...props}
		/>
	);
}

export type ToastContentProps = ComponentPropsWithRef<typeof BaseToast.Content>;

export function ToastContent({ className, ...props }: ToastContentProps) {
	return (
		<BaseToast.Content
			data-slot='toast-content'
			className={cn('flex w-full min-w-0 items-start gap-3', className)}
			{...props}
		/>
	);
}

export type ToastTitleProps = ComponentPropsWithRef<typeof BaseToast.Title>;

export function ToastTitle({ className, ...props }: ToastTitleProps) {
	return <BaseToast.Title data-slot='toast-title' className={cn('font-medium', className)} {...props} />;
}

export type ToastDescriptionProps = ComponentPropsWithRef<typeof BaseToast.Description>;

export function ToastDescription({ className, ...props }: ToastDescriptionProps) {
	return (
		<BaseToast.Description data-slot='toast-description' className={cn('text-sm opacity-80', className)} {...props} />
	);
}

export type ToastCloseProps = ComponentPropsWithRef<typeof BaseToast.Close>;

export function ToastClose({ className, ...props }: ToastCloseProps) {
	return (
		<BaseToast.Close
			data-slot='toast-close'
			className={cn('btn btn-ghost btn-sm btn-square shrink-0 self-start focus-visible:ring-2', className)}
			{...props}
		/>
	);
}

export const ToastAction = BaseToast.Action;

export const Toast = {
	Provider: ToastProvider,
	Portal: ToastPortal,
	Viewport: ToastViewport,
	Root: ToastRoot,
	Content: ToastContent,
	Title: ToastTitle,
	Description: ToastDescription,
	Close: ToastClose,
	Action: ToastAction,
	createToastManager,
	useToastManager,
};
