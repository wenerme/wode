import type React from 'react';
import classNames from 'clsx';
import { useSnapshot } from 'valtio';
import { getSupportedThemes } from './getSupportedThemes';
import { ThemePreviewCard } from './ThemePreviewCard';
import { useThemeState } from './useTheme';

export const ThemeListSelector: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, style, ...props }) => {
  const state = useThemeState();
  const { theme } = useSnapshot(state);
  const setTheme = (v: string) => {
    state.theme = v;
  };

  return (
    <div className={classNames('flex flex-wrap gap-1 p-2', className)} style={style} {...props}>
      {getSupportedThemes().map((v) => (
        <div
          key={v.value}
          onClick={() => {
            setTheme(v.value);
          }}
          className={classNames(
            'cursor-pointer rounded border p-1',
            'hover:border-info',
            theme === v.value ? 'border-primary' : 'border-transparent',
          )}
        >
          <div data-theme={v.value} className={'overflow-hidden rounded'}>
            <ThemePreviewCard title={v.label} />
          </div>
        </div>
      ))}
    </div>
  );
};
