import { createReactContext } from '@wener/reaction';
import { createStore } from 'zustand';
import { mutative } from 'zustand-mutative';

export type DaisyThemeStoreState = {
  theme?: 'system' | 'light' | 'dark' | 'custom' | string;
  light?: string;
  dark?: string;

  system?: 'light' | 'dark' | string;
  custom?: Record<string, any>;
  schema?: 'light' | 'dark';

  active?: string;
};

type ThemeStore = ReturnType<typeof createThemeStore>;

function createThemeStore() {
  return createStore(
    mutative<DaisyThemeStoreState>(() => {
      return {
        theme: 'system',
        light: 'light',
        dark: 'dark',
        // light: 'corporate',
        // dark: 'business',
      };
    }),
  );
}

export const DaisyThemeStoreContext = createReactContext<ThemeStore>('DaisyThemeStore', createThemeStore());
