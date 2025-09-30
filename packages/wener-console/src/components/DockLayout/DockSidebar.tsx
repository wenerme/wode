import React, { type ComponentPropsWithRef } from 'react';
import { clsx } from 'clsx';

export type DockSidebarProps = ComponentPropsWithRef<'div'> & {
	/**
	 * For standalone mode - controls visibility with sliding animation
	 */
	open?: boolean;
	/**
	 * Use fixed positioning (for standalone mode)
	 */
	fixed?: boolean;
};

export const DockSidebar = ({ children, className, open = true, fixed = false }: DockSidebarProps) => {
	return (
		<aside
			className={clsx(
				// Base layout
				'flex items-center',
				// Small screen: horizontal bar at top
				'order-1 w-full border-b px-2',
				// Medium screen: vertical sidebar on right
				'md:order-6 md:w-[57px] md:flex-col md:border-b-0 md:border-l md:px-0',
				// Fixed positioning for standalone mode
				fixed && [
					'fixed',
					// Small screen positioning with slide animation
					'h-[57px]',
					open ? 'top-0' : '-top-40',
					'transition-[top,right]',
					// Medium screen positioning with slide animation
					'md:top-0 md:py-4',
					open ? 'md:right-0' : 'md:-right-40',
					'md:h-full',
				],
				// Border color
				'border-color',
				// Custom className
				className,
			)}
		>
			{children}
		</aside>
	);
};
