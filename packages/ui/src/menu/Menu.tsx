import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const menuVariants = cva('menu', {
	variants: {
		size: {
			xs: 'menu-xs',
			sm: 'menu-sm',
			md: 'menu-md',
			lg: 'menu-lg',
			xl: 'menu-xl',
		},
		orientation: {
			vertical: 'menu-vertical',
			horizontal: 'menu-horizontal',
		},
	},
	defaultVariants: {
		size: 'md',
		orientation: 'vertical',
	},
});

export type MenuProps = ComponentPropsWithRef<'ul'> & VariantProps<typeof menuVariants>;

export function Menu({ className, size, orientation, ...props }: MenuProps) {
	return <ul data-slot='menu' className={cn(menuVariants({ size, orientation }), className)} {...props} />;
}

export type MenuItemProps = ComponentPropsWithRef<'li'> & {
	active?: boolean;
	disabled?: boolean;
};

export function MenuItem({ className, active = false, disabled = false, ...props }: MenuItemProps) {
	return (
		<li
			data-slot='menu-item'
			className={cn(active && 'menu-active', disabled && 'menu-disabled', className)}
			{...props}
		/>
	);
}

export type MenuTitleProps = ComponentPropsWithRef<'li'>;

export function MenuTitle({ className, ...props }: MenuTitleProps) {
	return <li data-slot='menu-title' className={cn('menu-title', className)} {...props} />;
}

export const MenuCompound = {
	Root: Menu,
	Item: MenuItem,
	Title: MenuTitle,
};
