import React from 'react';
import { AiFillTool } from 'react-icons/ai';
import { ModuleListCard } from '../common/ModuleListCard';

const Items = [
  {
    href: 'semver',
    icon: <div>V.</div>,
    title: '语义版本号',
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
