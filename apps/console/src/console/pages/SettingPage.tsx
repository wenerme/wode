import type { ReactNode } from 'react';
import type React from 'react';
import { AiFillExperiment, AiOutlineExperiment } from 'react-icons/ai';
import { FaRegUser, FaUser } from 'react-icons/fa6';
import { HiColorSwatch, HiOutlineColorSwatch } from 'react-icons/hi';
import { HiOutlineCog } from 'react-icons/hi2';
import { TiInfoLarge, TiInfoLargeOutline } from 'react-icons/ti';
import { ModuleMainLayout } from '@wener/console/console';
import type { ExpandableSideMenuItemProps } from '@wener/console/web';

const SettingItems: ExpandableSideMenuItemProps[] = [
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
  items = SettingItems,
}) => {
  return (
    <ModuleMainLayout title={'设置'} icon={<HiOutlineCog className={'h-8 w-8'} />} items={items} path={'/setting'}>
      {children}
    </ModuleMainLayout>
  );
};

export default SettingPage;
