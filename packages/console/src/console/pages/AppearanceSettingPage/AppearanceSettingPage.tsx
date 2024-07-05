import React from 'react';
import { useSnapshot } from 'valtio';
import { DaisyThemeDemo, ThemeListSelector, useThemeState } from '../../../daisy';
import { SettingLayout } from '../../../web/layouts/SettingLayout/SettingLayout';
import { getPrefersColorSchema } from '../../../web/utils';

export const AppearanceSettingPage = () => {
  const state = useThemeState();
  const { theme } = useSnapshot(state);
  const setTheme = (v: string) => {
    state.theme = v;
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
