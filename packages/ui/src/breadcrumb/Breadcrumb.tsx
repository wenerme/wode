import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export type BreadcrumbProps = ComponentPropsWithRef<'nav'>;

export function Breadcrumb({ className, ...props }: BreadcrumbProps) {
	return <nav data-slot='breadcrumb' aria-label='面包屑导航' className={cn('breadcrumbs', className)} {...props} />;
}

export type BreadcrumbListProps = ComponentPropsWithRef<'ol'>;

export function BreadcrumbList({ className, ...props }: BreadcrumbListProps) {
	return <ol data-slot='breadcrumb-list' className={cn('flex items-center', className)} {...props} />;
}

export type BreadcrumbItemProps = ComponentPropsWithRef<'li'>;

export function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
	return <li data-slot='breadcrumb-item' className={cn('inline-flex items-center gap-1.5', className)} {...props} />;
}

export type BreadcrumbLinkProps = ComponentPropsWithRef<'a'>;

export function BreadcrumbLink({ className, ...props }: BreadcrumbLinkProps) {
	return (
		<a
			data-slot='breadcrumb-link'
			className={cn('link link-hover inline-flex items-center leading-6', className)}
			{...props}
		/>
	);
}

export type BreadcrumbPageProps = ComponentPropsWithRef<'span'>;

export function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps) {
	return (
		<span
			data-slot='breadcrumb-page'
			aria-current='page'
			className={cn('inline-flex items-center leading-6 font-medium', className)}
			{...props}
		/>
	);
}

export type BreadcrumbSeparatorProps = ComponentPropsWithRef<'li'>;

export function BreadcrumbSeparator({ className, children = '/', ...props }: BreadcrumbSeparatorProps) {
	return (
		<li
			data-slot='breadcrumb-separator'
			role='presentation'
			aria-hidden='true'
			className={cn(
				'text-base-content/45 inline-flex h-6 shrink-0 items-center px-2 leading-none before:hidden!',
				'[&+[data-slot=breadcrumb-item]]:before:hidden!',
				className,
			)}
			{...props}
		>
			{children}
		</li>
	);
}

export type BreadcrumbChevronSeparatorProps = Omit<BreadcrumbSeparatorProps, 'children'>;

export function BreadcrumbChevronSeparator({ className, ...props }: BreadcrumbChevronSeparatorProps) {
	return (
		<BreadcrumbSeparator className={cn('px-2', className)} {...props}>
			<svg className='size-3.5 rtl:rotate-180' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
				<path d='m6 3 5 5-5 5' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' />
			</svg>
		</BreadcrumbSeparator>
	);
}

export const BreadcrumbCompound = {
	Root: Breadcrumb,
	List: BreadcrumbList,
	Item: BreadcrumbItem,
	Link: BreadcrumbLink,
	Page: BreadcrumbPage,
	Separator: BreadcrumbSeparator,
	ChevronSeparator: BreadcrumbChevronSeparator,
};
