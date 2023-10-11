import React from 'react';
import { SettingLayout } from '@wener/console/console';
import { DaisyThemeDemo, ThemeListSelector, useThemeState } from '@wener/console/daisy';
import { useSnapshot } from 'valtio';

function getPrefersColorSchema(): 'dark' | 'light' {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window?.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const SettingAppearance = () => {
  const state = useThemeState();
  const { theme } = useSnapshot(state);
  const setTheme = (v: string) => {
    state.theme = v;
  };
  return (
    <SettingLayout
      title={
        <>
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
        </>
      }
    >
      <ThemeListSelector />
      <div className='divider'>主题组件示例</div>
      <DaisyThemeDemo />
    </SettingLayout>
  );
};
export default SettingAppearance;
