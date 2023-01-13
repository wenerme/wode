import React from 'react';
import { AiFillTool } from 'react-icons/ai';
import { ModuleListCard } from '../common/ModuleListCard';

const Items = [
  {
    href: 'semver',
    icon: <div>V.</div>,
    title: '语义版本号',
  },
  {
    href: 'url-explain',
    icon: <div>U.</div>,
    title: 'URL解析',
  },
  {
    href: 'qrcode',
    icon: <div>Qr.</div>,
    title: '二维码',
  },
  {
    href: 'barcode',
    icon: <div>Br.</div>,
    title: '条形码',
  },
];
export const ToolHomePage = () => {
  return (
    <div className={'flex h-full items-center justify-center'}>
      <ModuleListCard items={Items} title={'工具'} figure={<AiFillTool className={'w-20 h-20 m-4'} />} />
    </div>
  );
};

export default ToolHomePage;
