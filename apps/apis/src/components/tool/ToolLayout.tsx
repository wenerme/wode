import React, { ReactNode } from 'react';
import { IoApps } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { Button } from 'common/src/daisy';
import { SettingLayout } from '../setting/SettingLayout';

export const ToolLayout: React.FC<{ children?: ReactNode }> = ({ children }) => {
  return (
    <SettingLayout
      title={'工具'}
      action={
        <div className={'tooltip tooltip-bottom'} data-tip={'设置'}>
          <Button as={Link} to={'.'} size={'sm'} square ghost>
            <IoApps />
          </Button>
        </div>
      }
    >
      {children}
    </SettingLayout>
  );
};
export default ToolLayout;
