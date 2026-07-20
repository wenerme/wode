import { clsx } from 'clsx';
import React, {
	type ComponentPropsWithoutRef,
	type ComponentPropsWithRef,
	type FC,
	type ReactElement,
	type ReactNode,
} from 'react';
import { Icon, LeftContentRightLayout } from '../../components';
import { cn } from '../../utils/cn';
import { NavLink } from '../links';
import { Tooltip } from '../Tooltip';
import { IconMenuSidebarLayout } from './IconMenuSidebarLayout';

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

const MenuBarItem: FC<{ item: NavItem }> = ({ item: { title, href, icon, iconActive, className, ...props } }) => {
	// NavLink 使用 useLocation 会每次 rerender
	return (
		<Tooltip.Composite delay={0} content={title} portal placement={'right'} className={'hidden md:block'}>
			{href ? (
				<NavLink
					href={href}
					className={({ isActive }: { isActive: boolean }) =>
						clsx(
							'btn btn-square btn-ghost btn-sm h-10 w-10 p-0',
							isActive ? 'text-base-content/90' : 'opacity-70',
							className,
						)
					}
					{...(props as ComponentPropsWithoutRef<'a'>)}
				>
					{({ isActive }: { isActive: boolean }) => (
						<Icon icon={icon} active={isActive} activeIcon={iconActive} className={'size-6'} />
					)}
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
		</Tooltip.Composite>
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
					<Tooltip.Provider>
						<IconMenuSidebarLayout top={renderItems(top)} center={renderItems(center)} bottom={renderItems(bottom)} />
					</Tooltip.Provider>
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

		let n = 0;
		const renderItem = (item: ItemProp): ReactNode[] => {
			let key = n++;
			if (React.isValidElement(item)) {
				return [item];
			}
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

			return [<MenuBarItem key={key} item={item as NavItem} />];
		};

		return items.flatMap((item, _i) => {
			return renderItem(item);
		});
	}
}
