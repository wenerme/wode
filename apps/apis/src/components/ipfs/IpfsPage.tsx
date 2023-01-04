import type { ReactNode } from 'react';
import React from 'react';
import { AiFillApi, AiOutlineApi, AiOutlineGateway } from 'react-icons/ai';
import { HiCog } from 'react-icons/hi2';
import { IpfsOutlined } from 'common/src/icons';
import type { ExpandableSideMenuItemProps} from 'common/src/layouts';
import { ExpandableSideMenuLayout } from 'common/src/layouts';

const MenuItems: ExpandableSideMenuItemProps[] = [
  {
    type: 'title',
    label: '网关',
    icon: <AiOutlineGateway />,
  },
  {
    label: '网关检测',
    href: '/ipfs/gateway/check',
    icon: <AiOutlineApi />,
    iconActive: <AiFillApi />,
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
  return (
    <ExpandableSideMenuLayout icon={<IpfsOutlined className={'h-8 w-8'} />} title={'IPFS'} items={MenuItems}>
      {children}
    </ExpandableSideMenuLayout>
  );
};
export default IpfsPage;
