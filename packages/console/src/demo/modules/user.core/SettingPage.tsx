import type { ReactNode } from 'react';
import React from 'react';
import { AiFillExperiment, AiOutlineExperiment } from 'react-icons/ai';
import { FaRegUser, FaUser } from 'react-icons/fa6';
import { HiColorSwatch, HiOutlineColorSwatch } from 'react-icons/hi';
import { HiOutlineCog } from 'react-icons/hi2';
import { TiInfoLarge, TiInfoLargeOutline } from 'react-icons/ti';
import type { ExpandableSideMenuItemProps } from '@wener/console/web';
import { ExpandableSideMenuLayout, usePageLayoutState } from '@wener/console/web';

export const DefaultMenuItems: ExpandableSideMenuItemProps[] = [
  {
    label: '用户资料',
    href: '/setting/profile',
    icon: <FaRegUser />,
    iconActive: <FaUser />,
  },
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
    href: '/setting/system/about',
    icon: <TiInfoLargeOutline />,
    iconActive: <TiInfoLarge />,
  },

  {
    type: 'title',
    label: '开发',
  },
  {
    label: '调试设置',
    href: '/setting/dev/debug',
    icon: <AiOutlineExperiment />,
    iconActive: <AiFillExperiment />,
  },
];
export const SettingPage: React.FC<{ children?: ReactNode; items?: ExpandableSideMenuItemProps[] }> = ({
  children,
  items = DefaultMenuItems,
}) => {
  const state = usePageLayoutState('user/setting', { initial: { expanded: true } });
  return (
    <ExpandableSideMenuLayout
      initialExpanded={state.expanded}
      onExpandedChange={(e) => (state.expanded = e)}
      icon={<HiOutlineCog className={'h-8 w-8'} />}
      title={'设置'}
      items={items}
    >
      {children}
    </ExpandableSideMenuLayout>
  );
};

export default SettingPage;
