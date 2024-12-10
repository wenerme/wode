'use client';

import React from 'react';
import { getPrefersColorSchema } from '@wener/console';
import { DaisyTheme, DaisyThemeDemo, ThemeListSelector } from '@wener/console/daisy';
import { useStore } from 'zustand';

export const DaisyThemePage = () => {
  const store = DaisyTheme.useThemeStore();
  const theme = useStore(store, (s) => {
    return s.theme;
  });
  const setTheme = (v: string) => {
    store.setState({ theme: v });
  };
  return (
    <div>
      <header className={'border-b'}>
        <div className={'flex items-center gap-2'}>
          <span className={'text-lg font-semibold'}>主题设置</span>
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
      </header>

      <ThemeListSelector />
      <div className='divider'>主题组件示例</div>
      <DaisyThemeDemo />
    </div>
  );
};
