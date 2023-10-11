import React from 'react';
import { useSnapshot } from 'valtio';
import { getPrefersColorSchema, ThemeListSelector, useThemeState } from '../../daisy/theme';
import { SettingLayout } from '../layouts';

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
                className='toggle toggle-sm toggle-accent'
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
    </SettingLayout>
  );
};
export default SettingAppearance;
