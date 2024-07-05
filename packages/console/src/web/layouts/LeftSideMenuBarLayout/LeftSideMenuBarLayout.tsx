import type { ComponentPropsWithoutRef, FC, HTMLProps, ReactElement } from 'react';
import React from 'react';
import { AutoNavLink } from '@wener/console/web';
import { clsx } from 'clsx';
import { Tooltip } from '@/floating';
import { cn } from '@/lib/utils';
import { HeaderContentFooterLayout } from '@/web/components/HeaderContentFooterLayout';
import { LeftContentRightLayout } from '@/web/components/LeftContentRightLayout';
import { OverlayScrollbar } from '@/web/components/OverlayScrollbar';

type BaseNavLink = React.ComponentType<BaseNavLinkProps>;

interface BaseNavLinkProps extends Record<string, any> {
  children: ReactElement | ((o: { isActive: boolean }) => ReactElement);
  className: string | ((o: { isActive: boolean }) => string);
}

const Layout: FC<
  HTMLProps<HTMLDivElement> & {
    top?: React.ReactNode;
    bottom?: React.ReactNode;
    center?: React.ReactNode;
  }
> = ({ className, top, bottom, center, children, ...props }) => {
  // bp 为 md
  // 小设备使用行显示

  /* 48+8+1 - 外层无 padding，因为可能中间会有滚动，外层 padding 后非常窄 */

  return (
    <LeftContentRightLayout
      className={'h-full flex-col md:flex-row'}
      left={<IconMenu top={top} center={center} bottom={bottom} />}
    >
      {children}
    </LeftContentRightLayout>
  );
};

export type NavItem =
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

const MenuBarItem: React.FC<{ item: NavItem; NavLink?: BaseNavLink }> = ({
  item: { title, href, icon, iconActive, className, ...props },
  NavLink = AutoNavLink,
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
          {({ isActive }) => (isActive ? iconActive || icon : icon)}
        </NavLink>
      ) : (
        <button
          type={'button'}
          className={clsx('btn btn-square btn-ghost btn-sm h-10 w-10 p-0', 'opacity-70', className)}
          {...(props as ComponentPropsWithoutRef<'button'>)}
        >
          {icon}
        </button>
      )}
    </Tooltip>
  );
};

export const IconMenu: React.FC<
  {
    top?: React.ReactNode;
    bottom?: React.ReactNode;
    center?: React.ReactNode;
  } & ComponentPropsWithoutRef<'aside'>
> = ({ top, bottom, children, center = children, className, ...props }) => {
  return (
    <HeaderContentFooterLayout
      as={'aside'}
      className={cn(
        'order-0 flex flex-row border-base-300',
        // 手机
        'h-[57px] w-full border-b px-2',
        // 桌面
        'md:h-full md:w-[57px] md:flex-col md:border-r md:px-0',
        //
        className,
      )}
      header={<div className={'flex items-center justify-center gap-1 border-base-300 py-1 md:border-b'}>{top}</div>}
      footer={<div className={'flex items-center justify-center gap-1 border-base-300 py-1 md:border-t'}>{bottom}</div>}
      {...props}
    >
      <OverlayScrollbar className={'h-full w-full'}>
        <div
          className={cn(
            // 8px padding
            'flex items-center gap-1 px-1 py-1',
            'flex-row',
            'md:flex-col',
            // 'overflow-x-auto overflow-y-hidden md:overflow-y-auto md:overflow-x-hidden'
          )}
        >
          {center}
        </div>
      </OverlayScrollbar>
    </HeaderContentFooterLayout>
  );
};

export const LeftSideMenuBarLayout = Object.assign(Layout, { MenuBarItem });
