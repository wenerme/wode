import type { ReactNode } from 'react';
import React from 'react';
import { HiColorSwatch, HiOutlineColorSwatch } from 'react-icons/hi';
import { HiOutlineCog } from 'react-icons/hi2';
import { TiInfoLarge, TiInfoLargeOutline } from 'react-icons/ti';
import type { ExpandableSideMenuItemProps } from '../../layouts';
import { ExpandableSideMenuLayout } from '../../layouts';
import { usePageLayoutState } from '../layouts/usePageLayoutState';

const MenuItems: ExpandableSideMenuItemProps[] = [
  {
    type: 'title',
    label: '显示和行为',
    icon: <HiOutlineColorSwatch />,
  },
  {
    label: '显示设置',
    href: '/setting/appearance',
    icon: <HiOutlineColorSwatch />,
    iconActive: <HiColorSwatch />,
  },
  {
    type: 'title',
    label: '系统',
  },
  {
    label: '系统信息',
    href: '/setting/system/info',
    icon: <TiInfoLargeOutline />,
    iconActive: <TiInfoLarge />,
  },
];
export const SettingPage: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const state = usePageLayoutState('setting');
  return (
    <ExpandableSideMenuLayout
      initialExpanded={state.expanded}
      onExpandedChange={(e) => (state.expanded = e)}
      icon={<HiOutlineCog className={'h-8 w-8'} />}
      title={'设置'}
      items={MenuItems}
    >
      {children}
    </ExpandableSideMenuLayout>
  );
};

export default SettingPage;
