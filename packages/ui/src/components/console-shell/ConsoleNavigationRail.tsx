import type { ReactNode } from 'react';
import { type ConsoleNavigationLinkComponent, ConsoleRail, ConsoleRailLink, ConsoleRailSection } from './ConsoleShell';

export type ConsoleRailItem = {
	id: string;
	href: string;
	label: string;
	icon: ReactNode;
	active?: boolean;
	className?: string;
};
export type ConsoleNavigationRailProps = {
	brand?: ReactNode;
	top?: readonly ConsoleRailItem[];
	items: readonly ConsoleRailItem[];
	bottom?: readonly ConsoleRailItem[];
	linkComponent?: ConsoleNavigationLinkComponent;
	className?: string;
};

/** 宿主提供图标、链接和选中状态；导航栏只负责一致的布局。 */
export function ConsoleNavigationRail({
	brand,
	top = [],
	items,
	bottom = [],
	linkComponent,
	className,
}: ConsoleNavigationRailProps) {
	const renderItem = ({ id, ...item }: ConsoleRailItem) => (
		<ConsoleRailLink key={id} {...item} linkComponent={linkComponent} />
	);
	return (
		<ConsoleRail className={className}>
			<ConsoleRailSection>
				{brand}
				{top.map(renderItem)}
			</ConsoleRailSection>
			<ConsoleRailSection grow>{items.map(renderItem)}</ConsoleRailSection>
			<ConsoleRailSection>{bottom.map(renderItem)}</ConsoleRailSection>
		</ConsoleRail>
	);
}
