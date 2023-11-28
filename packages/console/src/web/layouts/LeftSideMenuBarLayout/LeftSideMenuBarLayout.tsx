import type { FC, HTMLProps, ReactElement } from 'react';
import React from 'react';
import { clsx } from 'clsx';
import { Tooltip } from '../../../components/floating';
import { AutoNavLink } from '../../links';
import type { BaseNavLink } from '../ExpandableSideMenuLayout/BaseNavLink';

const Layout: FC<
  HTMLProps<HTMLDivElement> & {
    top?: React.ReactNode;
    bottom?: React.ReactNode;
    center?: React.ReactNode;
  }
> = ({ className, top, bottom, center, children, ...props }) => {
  // bp 为 md
  // 小设备使用行显示
  return (
    <div className={clsx('isolate flex min-h-full flex-col md:flex-row', className)} {...props}>
      {/* 48+8+1 - 外层无 padding，因为可能中间会有滚动，外层 padding 后非常窄 */}
      <aside
        className={clsx(
          'order-0 z-50 flex flex-row border-base-300',
          // 手机
          'w-full border-b px-2',
          // 桌面
          'md:w-[57px] md:flex-col md:border-r md:px-0',
          // 下面的两个 flex
          '[&>.flex]:flex-row md:[&>.flex]:flex-col',
        )}
      >
        <div className={'flex items-center gap-1 border-base-300 py-1 md:border-b'}>{top}</div>
        <div className={'scrollbar-thin relative flex-1 overflow-x-hidden'}>
          <div
            className={clsx(
              'absolute inset-0 flex items-center gap-1 py-1 ',
              'flex-row overflow-x-auto overflow-y-hidden ',
              'md:flex-col md:overflow-y-auto md:overflow-x-hidden',
            )}
          >
            {center}
          </div>
        </div>
        <div className={'flex items-center gap-1 border-t border-base-300 py-1'}>{bottom}</div>
      </aside>
      <main className={'relative order-5 flex-1'}>
        <div className={'absolute inset-0 overflow-auto'}>{children}</div>
      </main>
    </div>
  );
};

export interface NavItem {
  title: string;
  href?: string;
  icon: ReactElement;
  iconActive?: ReactElement;
}

const MenuBarItem: React.FC<{ item: NavItem; NavLink?: BaseNavLink }> = ({
  item: { title, href, icon, iconActive },
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
            clsx('btn btn-square btn-ghost btn-sm h-10 w-10 p-0', isActive ? 'text-base-content/90' : 'opacity-70')
          }
        >
          {({ isActive }) => (isActive ? iconActive || icon : icon)}
        </NavLink>
      ) : (
        <button type={'button'} className={clsx('btn btn-square btn-ghost btn-sm h-10 w-10 p-0', 'opacity-70')}>
          {icon}
        </button>
      )}
    </Tooltip>
  );
};

export const LeftSideMenuBarLayout = Object.assign(Layout, { MenuBarItem });
