import React, { useDeferredValue, useEffect, useLayoutEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { derive, watch } from 'valtio/utils';
import { useDebugRender } from '@wener/reaction';
import { getPrefersColorSchema } from './getPrefersColorSchema';
import { getSupportedThemes } from './getSupportedThemes';
import { proxyWithCompare } from './proxyWithCompare';
import { setElementThemeAttribute } from './setElementThemeAttribute';

interface ThemeState {
  theme?: string; // 用户选择主题
  light?: string; // 覆盖系统亮色主题
  dark?: string; // 覆盖系统暗色主题

  active?: string; //  当前主题
  system?: string; // 当前系统主题 - state self-contained
}

const DefaultState = {
  theme: 'system',
  // 修改默认主题色
  light: 'corporate',
  dark: 'business',
};

function createThemeState() {
  const state = proxyWithCompare<ThemeState>({
    ...DefaultState,
  });
  return derive(
    {
      active: (get) => {
        return getActiveTheme(get(state));
      },
    },
    {
      proxy: state,
    },
  );
}

const themeState = createThemeState();
const ThemeStateContext = React.createContext(themeState);

export function useThemeState() {
  return React.useContext(ThemeStateContext);
}

function getActiveTheme(s: ThemeState) {
  let theme = s.theme || 'system';
  if (theme === 'system') {
    theme = s.system || 'light';
    switch (theme) {
      case 'dark':
        return s.dark || theme;
      case 'light':
        return s.light || theme;
    }
  }
  return theme || 'light';
}

export function useActiveTheme(): string {
  let s = useSnapshot(useThemeState());
  return s.active;
}

export function useThemeSchema(): 'light' | 'dark' {
  const theme = useSnapshot(useThemeState()).theme;
  switch (theme) {
    case 'system':
      return getPrefersColorSchema();
    case 'dark':
    case 'light':
      return theme;
    default:
      return getSupportedThemes().find((v) => v.value === theme)?.type ?? 'light';
  }
}

export const ThemeConnector = () => {
  let state = useThemeState();
  const [init, setInit] = useState(false);
  const log = useDebugRender('ThemeConnector');
  const key = 'THEME_STATE';
  useEffect(() => {
    const loadState = (s: string | null) => {
      let neo = DefaultState;
      try {
        if (s) {
          let { dark = DefaultState.dark, light = DefaultState.light, theme = DefaultState.theme } = JSON.parse(s);
          neo = { dark, light, theme };
        }
      } catch (e) {}
      Object.assign(state, neo);
    };
    const handler = (e: StorageEvent) => {
      if (e.key !== key) {
        return;
      }
      loadState(e.newValue);
    };
    loadState(localStorage.getItem(key));
    window.addEventListener('storage', handler);
    state.system = getPrefersColorSchema();
    setInit(true);
    return () => {
      window.removeEventListener('storage', handler);
    };
  }, [state]);
  useEffect(() => {
    if (!init) {
      return;
    }
    return watch((get) => {
      const { light, dark, theme } = get(state);
      log(`changed:`, { light, dark, theme });
      localStorage[key] = JSON.stringify({ light, dark, theme });
    });
  }, [state, init]);

  useLayoutEffect(() => {
    return watchPrefersColorSchema(() => {
      state.system = getPrefersColorSchema();
    });
  }, [state]);

  let snapshot = useSnapshot(state);
  const active = useDeferredValue(snapshot.active);
  useEffect(() => {
    if (!init) {
      return;
    }
    log(`set:`, active, state);
    setElementThemeAttribute(active);
  }, [active, init]);
  return <></>;
};

function watchPrefersColorSchema(cb: (light: boolean) => void) {
  const listener = (event: MediaQueryListEvent) => {
    cb(event.matches);
  };
  const target = window.matchMedia('(prefers-color-scheme: light)');
  cb(target.matches);
  target.addEventListener('change', listener);
  return () => target.removeEventListener('change', listener);
}
