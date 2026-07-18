import type { ReactNode } from 'react';
import { cn } from '../utils/cn';
import { IconMenuSidebarLayout } from './IconSidebarLayout/IconMenuSidebarLayout';
import { LeftContentRightLayout } from './LeftContentRightLayout';
import { Tooltip } from './Tooltip';

export type StaticAppSidebarItem = {
	title: string;
	href: string;
	icon: ReactNode;
	activeIcon?: ReactNode;
	isActive?: boolean;
};

export function StaticAppSidebarLink({ item, className }: { item: StaticAppSidebarItem; className?: string }) {
	const icon = item.isActive && item.activeIcon ? item.activeIcon : item.icon;
	return (
		<Tooltip.Composite delay={0} content={item.title} portal placement='right' className='hidden md:block'>
			<a
				href={item.href}
				className={cn(
					'btn btn-square btn-ghost btn-sm h-10 w-10 p-0',
					item.isActive ? 'text-base-content/90' : 'opacity-70',
					className,
				)}
			>
				{icon}
			</a>
		</Tooltip.Composite>
	);
}

export function StaticAppSidebarLayout({
	brand,
	items,
	footerItems,
	right,
	children,
	className,
}: {
	brand?: ReactNode;
	items?: StaticAppSidebarItem[];
	footerItems?: StaticAppSidebarItem[];
	right?: ReactNode;
	children?: ReactNode;
	className?: string;
}) {
	return (
		<LeftContentRightLayout
			left={
				<Tooltip.Provider>
					<IconMenuSidebarLayout
						top={brand}
						center={
							<>
								{items?.map((item) => (
									<StaticAppSidebarLink key={item.href} item={item} />
								))}
							</>
						}
						bottom={
							<>
								{footerItems?.map((item) => (
									<StaticAppSidebarLink key={item.href} item={item} />
								))}
							</>
						}
					/>
				</Tooltip.Provider>
			}
			right={right}
			className={cn('min-h-screen flex-col md:flex-row', className)}
		>
			{children}
		</LeftContentRightLayout>
	);
}
