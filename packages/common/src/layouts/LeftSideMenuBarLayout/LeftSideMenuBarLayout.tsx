import type { FC, HTMLProps, ReactElement } from 'react';
import React from 'react';
import classNames from 'classnames';
import { AutoNavLink } from '../../components/links';
import { Tooltip } from '../../floating';
import { BaseNavLink } from '../ExpandableSideMenuLayout/BaseNavLink';

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
    <div className={classNames('isolate flex flex-col md:flex-row min-h-full', className)} {...props}>
      {/* 48+8+1 - 外层无 padding，因为可能中间会有滚动，外层 padding 后非常窄 */}
      <aside
        className={classNames(
          'z-50 flex flex-row order-0 border-base-300',
          // 手机
          'w-full border-b px-2',
          // 桌面
          'md:w-[57px] md:flex-col md:border-r',
          // 下面的两个 flex
          '[&>.flex]:flex-row md:[&>.flex]:flex-col',
        )}
      >
        <div className={'flex items-center gap-1 py-1 md:border-b border-base-300'}>{top}</div>
        <div className={'relative flex-1 scrollbar-thin overflow-x-hidden'}>
          <div
            className={classNames(
              'absolute inset-0 flex items-center gap-1 py-1 ',
              'overflow-y-hidden overflow-x-auto flex-row ',
              'md:overflow-y-auto md:overflow-x-hidden md:flex-col',
            )}
          >
            {center}
          </div>
        </div>
        <div className={'flex items-center gap-1 py-1 border-t border-base-300'}>{bottom}</div>
      </aside>
      <main className={'relative flex-1 order-5'}>
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
            classNames(
              'btn btn-ghost btn-sm h-10 w-10 btn-square p-0',
              isActive ? 'text-base-content/90' : 'opacity-70',
            )
          }
        >
          {({ isActive }) => (isActive ? iconActive || icon : icon)}
        </NavLink>
      ) : (
        <button type={'button'} className={classNames('btn btn-ghost btn-sm h-10 w-10 btn-square p-0', 'opacity-70')}>
          {icon}
        </button>
      )}
    </Tooltip>
  );
};

export const LeftSideMenuBarLayout = Object.assign(Layout, { MenuBarItem });
