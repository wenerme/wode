import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export type PaginationProps = ComponentPropsWithRef<'nav'>;

export function Pagination({ className, ...props }: PaginationProps) {
	return (
		<nav data-slot='pagination' aria-label='分页导航' className={cn('flex justify-center', className)} {...props} />
	);
}

export type PaginationListProps = ComponentPropsWithRef<'ul'>;

export function PaginationList({ className, ...props }: PaginationListProps) {
	return <ul data-slot='pagination-list' className={cn('join', className)} {...props} />;
}

export type PaginationItemProps = ComponentPropsWithRef<'li'>;

export function PaginationItem({ className, ...props }: PaginationItemProps) {
	return <li data-slot='pagination-item' className={className} {...props} />;
}

export type PaginationLinkProps = ComponentPropsWithRef<'a'> & {
	active?: boolean;
};

export function PaginationLink({ className, active = false, ...props }: PaginationLinkProps) {
	return (
		<a
			data-slot='pagination-link'
			aria-current={active ? 'page' : undefined}
			className={cn('btn join-item', active ? 'btn-active' : 'btn-ghost', className)}
			{...props}
		/>
	);
}

export type PaginationButtonProps = ComponentPropsWithRef<'button'> & {
	active?: boolean;
};

export function PaginationButton({ className, active = false, type = 'button', ...props }: PaginationButtonProps) {
	return (
		<button
			data-slot='pagination-button'
			type={type}
			aria-current={active ? 'page' : undefined}
			className={cn('btn join-item', active ? 'btn-active' : 'btn-ghost', className)}
			{...props}
		/>
	);
}

export const PaginationCompound = {
	Root: Pagination,
	List: PaginationList,
	Item: PaginationItem,
	Link: PaginationLink,
	Button: PaginationButton,
};
