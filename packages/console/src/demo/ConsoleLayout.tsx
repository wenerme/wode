import type { PropsWithChildren, ReactNode } from 'react';
import React from 'react';
import { SiteLogo } from '@wener/console/console';
import { useContextStore } from '../hooks';
import { AutoNavLink, DockLayout, LeftSideMenuBarLayout } from '../web';
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

const TopItems = [
  {
    title: '首页',
    href: '/',
    icon: <SiteLogo />,
  },
];

export const ConsoleLayout: React.FC<{ children?: ReactNode }> = ({ children }) => {
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
