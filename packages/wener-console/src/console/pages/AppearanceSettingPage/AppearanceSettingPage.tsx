'use client';

import React from 'react';
import { DaisyTheme, DaisyThemeDemo, ThemeListSelector } from '../../../daisy';
import { SettingLayout } from '../../../web';
import { getPrefersColorSchema } from '../../../web/utils';

export const AppearanceSettingPage = () => {
  const [{ theme }, update] = DaisyTheme.useThemeState();
  const setTheme = (v: string) => {
    update({ theme: v });
  };
  return (
    <SettingLayout
      title={
        <div className={'flex items-center gap-2'}>
          <span>主题设置</span>
          <div className='form-control'>
            <label className='label cursor-pointer'>
              <span className='label-text'>使用系统配色</span>
              <input
                type='checkbox'
                className='toggle toggle-accent toggle-sm'
                checked={theme === 'system'}
                onChange={() => {
                  setTheme(theme === 'system' ? getPrefersColorSchema() : 'system');
                }}
              />
            </label>
          </div>
        </div>
      }
    >
      <ThemeListSelector />
      <div className='divider'>主题组件示例</div>
      <DaisyThemeDemo />
    </SettingLayout>
  );
};
export default AppearanceSettingPage;
