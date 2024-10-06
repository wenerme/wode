import React, { type ReactNode } from 'react';
import { AiFillApi, AiOutlineApi, AiOutlineGateway } from 'react-icons/ai';
import { HiCog } from 'react-icons/hi2';
import { SiTestin } from 'react-icons/si';
import { ExpandableSideMenuLayout, usePageLayoutState, type ExpandableSideMenuItemProps } from '@wener/console/web';
import { IpfsOutlined } from 'common/icons';

const MenuItems: ExpandableSideMenuItemProps[] = [
  {
    label: 'IPFS Access',
    href: '/ipfs',
    end: true,
    icon: <IpfsOutlined className={'h-5 w-5'} />,
  },
  {
    type: 'title',
    label: '网关',
    icon: <AiOutlineGateway />,
  },
  {
    label: '网关检测',
    href: '/ipfs/gateway/check',
    icon: <SiTestin />,
  },
  {
    type: 'title',
    label: '设置',
    icon: <HiCog />,
  },
  {
    label: '网关设置',
    href: '/ipfs/setting/gateway',
    icon: <AiOutlineApi />,
    iconActive: <AiFillApi />,
  },
];

export const IpfsPage: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const state = usePageLayoutState('ipfs');
  return (
    <ExpandableSideMenuLayout
      initialExpanded={state.expanded}
      onExpandedChange={(e) => (state.expanded = e)}
      icon={<IpfsOutlined className={'h-8 w-8'} />}
      title={'IPFS'}
      items={MenuItems}
    >
      {children}
    </ExpandableSideMenuLayout>
  );
};
export default IpfsPage;
