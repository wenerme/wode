import React, {
	type ComponentPropsWithoutRef,
	type ComponentPropsWithRef,
	type FC,
	type ReactElement,
	type ReactNode,
} from 'react';
import { clsx } from 'clsx';
import { HeaderContentFooterLayout, Icon, LeftContentRightLayout, OverlayScrollbar } from '../../components';
import { Tooltip } from '../../floating';
import { cn } from '../../utils/cn';
import { NavLink } from '../links';
import type { INavLink } from '../links/NavLink';

type GroupItem = {
	type: 'group';
	// name?: string;
	title?: ReactNode;
	items: NavItem[];
};

type NavItem =
	| (ComponentPropsWithoutRef<'a'> & {
			title: string;
			href: string;
			icon: ReactElement;
			iconActive?: ReactElement;
	  })
	| (ComponentPropsWithoutRef<'button'> & {
			title: string;
			href?: string;
			type?: string;
			icon: ReactElement;
			iconActive?: ReactElement;
	  });

type ItemProp = GroupItem | NavItem;

const MenuBarItem: FC<{ item: NavItem; NavLink?: INavLink }> = ({
	item: { title, href, icon, iconActive, className, ...props },
	NavLink = NavLink,
}) => {
	// NavLink 使用 useLocation 会每次 rerender
	// due to overflow, tooltip not works
	return (
		<Tooltip content={title} portal placement={'right'} className={'hidden md:block'}>
			{href ? (
				<NavLink
					href={href}
					className={({ isActive }) =>
						clsx(
							'btn btn-square btn-ghost btn-sm h-10 w-10 p-0',
							isActive ? 'text-base-content/90' : 'opacity-70',
							className,
						)
					}
					{...props}
				>
					{({ isActive }) => <Icon icon={icon} active={isActive} activeIcon={iconActive} className={'size-6'} />}
				</NavLink>
			) : (
				<button
					type={'button'}
					className={clsx('btn btn-square btn-ghost btn-sm h-10 w-10 p-0', 'opacity-70', className)}
					{...(props as ComponentPropsWithoutRef<'button'>)}
				>
					<Icon icon={icon} className={'size-6'} />
				</button>
			)}
		</Tooltip>
	);
};

export const IconMenuSidebarLayout: FC<
	{
		top?: ReactNode;
		bottom?: ReactNode;
		center?: ReactNode;
	} & ComponentPropsWithoutRef<'aside'>
> = ({ top, bottom, children, center = children, className, ...props }) => {
	return (
		<HeaderContentFooterLayout
			as={'aside'}
			className={cn(
				'border-base-300 order-0 flex flex-row',
				// 手机
				'h-[57px] w-full border-b px-2',
				// 桌面
				'md:h-full md:w-[57px] md:flex-col md:border-r md:px-0',
				//
				className,
			)}
			header={<div className={'border-base-300 flex items-center justify-center gap-1 py-1 md:border-b'}>{top}</div>}
			footer={<div className={'border-base-300 flex items-center justify-center gap-1 py-1 md:border-t'}>{bottom}</div>}
			{...props}
		>
			<OverlayScrollbar className={'h-full w-full'}>
				<div
					className={cn(
						// 8px padding
						'flex items-center gap-1 px-1 py-1',
						'flex-row',
						'md:flex-col',
						// 'overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto',
					)}
				>
					{center}
				</div>
			</OverlayScrollbar>
		</HeaderContentFooterLayout>
	);
};

export namespace IconSidebarLayout {
	export type LayoutProps = ComponentPropsWithRef<'div'> & {
		top?: ReactNode | ItemProp[];
		bottom?: ReactNode | ItemProp[];
		center?: ReactNode | ItemProp[];
	};

	export const Layout: FC<LayoutProps> = ({ className, top, bottom, center, children, ...props }) => {
		// bp 为 md
		// 小设备使用行显示

		/* 48+8+1 - 外层无 padding，因为可能中间会有滚动，外层 padding 后非常窄 */

		return (
			<LeftContentRightLayout
				left={
					<IconMenuSidebarLayout top={renderItems(top)} center={renderItems(center)} bottom={renderItems(bottom)} />
				}
				className={cn('h-full flex-col md:flex-row', className)}
				{...props}
			>
				{children}
			</LeftContentRightLayout>
		);
	};

	export const Item = MenuBarItem;

	const Divider = ({ children, ...props }: ComponentPropsWithRef<'div'>) => {
		return (
			<div
				{...props}
				className={cn('w-full border-b pt-4 text-center text-[12px] font-bold opacity-40', props.className)}
			>
				{children}
			</div>
		);
	};

	function renderItems(items: ReactNode | ItemProp[]): ReactNode {
		if (!Array.isArray(items)) {
			return items;
		}
		const NavLink: INavLink = NavLink;

		let n = 0;
		const renderItem = (item: ItemProp): ReactNode[] => {
			let key = n++;
			if ('type' in item && item.type === 'group') {
				let o: ReactNode[] = [];
				if (item.title) {
					o.push(<Divider key={key}>{item.title}</Divider>);
				}

				if ('items' in item && Array.isArray(item.items)) {
					return o.concat(items.flatMap((v) => renderItem(v)));
				}

				return o;
			}
			return [<MenuBarItem NavLink={NavLink} key={key} item={item as NavItem} />];
		};

		return items.flatMap((item, i) => {
			return renderItem(item);
		});
	}
}

export const LeftSideMenuBarLayout = Object.assign(IconSidebarLayout.Layout, { MenuBarItem });
