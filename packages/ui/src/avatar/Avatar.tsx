import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const avatarVariants = cva('avatar relative inline-flex shrink-0 overflow-hidden', {
	variants: {
		size: {
			xs: 'size-6',
			sm: 'size-8',
			md: 'size-10',
			lg: 'size-12',
			xl: 'size-16',
		},
		shape: {
			circle: 'rounded-full',
			square: 'rounded-field',
			squircle: 'mask mask-squircle',
		},
		status: {
			default: '',
			online: 'avatar-online',
			offline: 'avatar-offline',
		},
	},
	defaultVariants: {
		size: 'md',
		shape: 'circle',
		status: 'default',
	},
});

export type AvatarProps = ComponentPropsWithRef<typeof BaseAvatar.Root> & VariantProps<typeof avatarVariants>;

export function Avatar({ className, size, shape, status, ...props }: AvatarProps) {
	return (
		<BaseAvatar.Root data-slot='avatar' className={cn(avatarVariants({ size, shape, status }), className)} {...props} />
	);
}

export type AvatarImageProps = ComponentPropsWithRef<typeof BaseAvatar.Image>;

export function AvatarImage({ className, ...props }: AvatarImageProps) {
	return <BaseAvatar.Image data-slot='avatar-image' className={cn('size-full object-cover', className)} {...props} />;
}

export type AvatarFallbackProps = ComponentPropsWithRef<typeof BaseAvatar.Fallback>;

export function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
	return (
		<BaseAvatar.Fallback
			data-slot='avatar-fallback'
			className={cn('bg-neutral text-neutral-content grid size-full place-items-center font-medium', className)}
			{...props}
		/>
	);
}

export const AvatarCompound = {
	Root: Avatar,
	Image: AvatarImage,
	Fallback: AvatarFallback,
};
