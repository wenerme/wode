import type { PropsWithChildren, ReactNode } from 'react';
import React from 'react';
import { BiHomeHeart, BiHomeSmile } from 'react-icons/bi';
import { useContextStore } from '@wener/console';
import { SitePreferences } from '@wener/console/web';
import { AutoNavLink, DockLayout, LeftSideMenuBarLayout } from '@wener/console/web';
import type { ConsoleLayoutContext, DashMenu } from './ConsoleLayoutContext';

const { MenuBarItem } = LeftSideMenuBarLayout;

const TitleDivider: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className={'w-full border-b pt-4 text-center text-[12px] font-bold opacity-40'}>{children}</div>;
};

function renderMenuItems(items: DashMenu[]): ReactNode[] {
  const NavLink = AutoNavLink;
  return items.map((item, i) => {
    if ('type' in item) {
      if (item.type === 'group') {
        return [
          item.title ? <TitleDivider key={item.name || item.title}>{item.title}</TitleDivider> : null,
          ...renderMenuItems(item.items),
        ];
      }
      return null;
    }
    return [<MenuBarItem NavLink={NavLink} key={`${i}-${item.title}`} item={item} />];
  });
}

const SiteLogo: React.FC<{ active?: boolean }> = ({ active }) => {
  const { useWatch } = useContextStore<SitePreferences>();
  const logo = useWatch('site.logo');
  return logo || (!active ? <BiHomeSmile className={'h-6 w-6'} /> : <BiHomeHeart className={'h-6 w-6'} />);
};
const TopItems = [
  {
    title: '首页',
    href: '/',
    icon: <SiteLogo />,
  },
];

export const PrimaryLayout: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const NavLink = AutoNavLink;
  const { useWatch } = useContextStore<ConsoleLayoutContext>();
  const { top = [], center = [], bottom = [] } = useWatch('console.menu') ?? {};
  return (
    <LeftSideMenuBarLayout
      className={'min-h-screen flex-1'}
      top={renderMenuItems([...TopItems, ...top])}
      center={renderMenuItems(center)}
      bottom={renderMenuItems(bottom)}
    >
      <DockLayout>{children}</DockLayout>
    </LeftSideMenuBarLayout>
  );
};
