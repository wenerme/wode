import React from 'react';
import { useSnapshot } from 'valtio';
import { ThemeListSelector, useThemeState } from '../../daisy/theme';
import { getPrefersColorSchema } from '../../daisy/theme/getPrefersColorSchema';

export const SettingAppearance = () => {
  const state = useThemeState();
  const { theme } = useSnapshot(state);
  const setTheme = (v: string) => {
    state.theme = v;
  };

  return (
    <div className={'w-full p-4'}>
      <h3 className={'flex items-center gap-4 p-2 text-lg font-medium'}>
        <span>主题设置</span>
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">使用系统配色</span>
            <input
              type="checkbox"
              className="toggle toggle-accent"
              checked={theme === 'system'}
              onChange={() => {
                setTheme(theme === 'system' ? getPrefersColorSchema() : 'system');
              }}
            />
          </label>
        </div>
      </h3>
      <hr />

      <ThemeListSelector />
    </div>
  );
};
export default SettingAppearance;
