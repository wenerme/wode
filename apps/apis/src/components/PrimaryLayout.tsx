import type { ReactNode} from 'react';
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { FaUsersCog } from 'react-icons/fa';
import { HiAdjustmentsHorizontal, HiKey, HiOutlineAdjustmentsHorizontal, HiOutlineKey } from 'react-icons/hi2';
import type { AutoNavLinkProps } from 'common/src/components/links';
import { AutoNavLink } from 'common/src/components/links';
import { DockLayout, LeftSideMenuBarLayout } from 'common/src/layouts';
import { WenerLogo } from './WenerLogo';

const { MenuBarItem } = LeftSideMenuBarLayout;

const TopItems = [
  {
    title: '首页',
    href: '/',
    icon: <WenerLogo />,
  },
];

const CenterItems = [
  {
    title: '密码',
    href: '/password',
    icon: <HiOutlineKey className={'h-6 w-6'} />,
    iconActive: <HiKey className={'h-6 w-6'} />,
  },
  {
    title: '用户管理',
    href: '/auth/admin',
    icon: <FaUsersCog className={'h-6 w-6'} />,
  },
];

const BottomItems = [
  {
    title: '设置',
    href: '/setting',
    icon: <HiOutlineAdjustmentsHorizontal className={'h-6 w-6'} />,
    iconActive: <HiAdjustmentsHorizontal className={'h-6 w-6'} />,
  },
];

const Layout: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const NavLink = AutoNavLink;
  return (
    <LeftSideMenuBarLayout
      className={'min-h-screen flex-1'}
      top={
        <>
          {TopItems.map((item, i) => {
            return <MenuBarItem NavLink={NavLink} key={`${i}-${item.title}`} item={item} />;
          })}
        </>
      }
      center={
        <>
          {CenterItems.map((item, i) => {
            return <MenuBarItem NavLink={NavLink} key={`${i}-${item.title}`} item={item} />;
          })}
        </>
      }
      bottom={
        <>
          {BottomItems.map((item, i) => {
            return <MenuBarItem NavLink={NavLink} key={`${i}-${item.title}`} item={item} />;
          })}
        </>
      }
    >
      <DockLayout>{children}</DockLayout>
    </LeftSideMenuBarLayout>
  );
};

export const PrimaryLayout = Object.assign(Layout, { TopItems, CenterItems, BottomItems });

/**
 *  不会添加 basename
 */
const NavLink = forwardRef<HTMLAnchorElement, AutoNavLinkProps>(({ href, children, className, ...rest }, ref) => {
  const [isActive, setActive] = useState(() =>
    new URL(globalThis.location?.href || 'http://127.0.0.1:3000').pathname.startsWith(href),
  );
  const onUrl = (s: string) => {
    new URL(s).pathname.startsWith(href) ? setActive(true) : setActive(false);
  };
  const cbRef = useRef<(s: string) => void>(onUrl);
  cbRef.current = onUrl;
  useEffect(() => {
    const navigation = (globalThis as any).navigation as EventTarget;
    const callback = (e: any) => {
      cbRef.current(e.destination.url as string);
    };
    navigation?.addEventListener('navigate', callback);
    return () => {
      navigation?.removeEventListener('navigate', callback);
    };
  }, []);
  return (
    <a
      href={href}
      ref={ref}
      className={typeof className === 'function' ? className({ isActive }) : className}
      {...rest}
    >
      {typeof children === 'function' ? children({ isActive }) : children}
    </a>
  );
});

NavLink.displayName = 'NavLink';
