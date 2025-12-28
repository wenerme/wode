import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export namespace ConsoleLayout {
	export type RootProps = ComponentPropsWithRef<'div'>;
	export type MenuProps = ComponentPropsWithRef<'aside'>;
	export type MainProps = ComponentPropsWithRef<'main'>;
	export type DockProps = ComponentPropsWithRef<'aside'>;

	export interface CompositeProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
		menu?: ReactNode;
		dock?: ReactNode;
		children?: ReactNode;
	}

	/**
	 * Composite layout combining Menu, Main, and Dock in a single component
	 */
	export function Composite({ menu, dock, children, className, ...props }: CompositeProps) {
		return (
			<Root className={className} {...props}>
				{menu && <Menu>{menu}</Menu>}
				<Main>{children}</Main>
				{dock && <Dock>{dock}</Dock>}
			</Root>
		);
	}

	/**
	 * Root layout container with responsive flex layout
	 * - Mobile: column layout (flex-col)
	 * - Desktop: row layout (flex-row)
	 */
	export function Root({ children, className, ...props }: RootProps) {
		return (
			<div className={cn('flex h-screen w-full overflow-hidden', 'flex-col md:flex-row', className)} {...props}>
				{children}
			</div>
		);
	}

	/**
	 * Left sidebar menu area
	 * - Fixed width (57px on desktop)
	 * - Supports top/center/bottom sections via children
	 */
	export function Menu({ children, className, ...props }: MenuProps) {
		return (
			<aside
				className={cn(
					'border-color bg-base-100 flex items-center',
					'order-1 w-full border-b px-2',
					'md:order-1 md:h-full md:w-[57px] md:flex-col md:border-r md:border-b-0 md:px-0',
					className,
				)}
				{...props}
			>
				{children}
			</aside>
		);
	}

	/**
	 * Main content area
	 * - Fills remaining space
	 * - Has internal scroll container
	 */
	export function Main({ children, className, ...props }: MainProps) {
		return (
			<main className={cn('relative order-2 h-full flex-1 overflow-auto', className)} {...props}>
				<div className={'scrollbar-thin absolute inset-0 isolate'}>{children}</div>
			</main>
		);
	}

	/**
	 * Right/Bottom dock area
	 * - Mobile: top display
	 * - Desktop: right side display
	 */
	export function Dock({ children, className, ...props }: DockProps) {
		return (
			<aside
				className={cn(
					'border-color bg-base-100 flex items-center',
					'order-3 w-full border-t px-2',
					'md:order-3 md:h-full md:w-[57px] md:flex-col md:border-t-0 md:border-l md:px-0',
					className,
				)}
				{...props}
			>
				{children}
			</aside>
		);
	}
}
