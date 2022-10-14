import React, { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { derive, watch } from 'valtio/utils';
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

export function createThemeState(o: Partial<ThemeState> = {}) {
  const state = proxyWithCompare<ThemeState>({
    ...DefaultState,
    ...o,
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

export function hookThemeState({
  state,
  element,
  loadInitialState = true,
}: {
  state: ThemeState;
  element?: HTMLElement;
  loadInitialState?: boolean;
}) {
  if (!globalThis.localStorage) {
    return () => {};
  }

  const closer: Array<() => void> = [];
  const key = 'THEME_STATE';
  // init load
  const loadState = (s: string | null) => {
    if (!s) {
      return;
    }
    let neo = DefaultState;
    try {
      if (s) {
        let { dark = DefaultState.dark, light = DefaultState.light, theme = DefaultState.theme } = JSON.parse(s);
        neo = { dark, light, theme };
      }
    } catch (e) {}
    Object.assign(state, neo);
  };
  if (loadInitialState) {
    loadState(localStorage.getItem(key));
  }
  // watch storage state change - cross tab
  {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key) {
        return;
      }
      loadState(e.newValue);
    };
    window.addEventListener('storage', handleStorageChange);
    closer.push(() => window.removeEventListener('storage', handleStorageChange));
  }
  // system
  {
    state.system = getPrefersColorSchema();
    closer.push(
      watchPrefersColorSchema(() => {
        state.system = getPrefersColorSchema();
      }),
    );
  }

  // persist
  {
    const unsub = watch((get) => {
      const { light, dark, theme } = get(state);
      localStorage[key] = JSON.stringify({ light, dark, theme });
    });
    closer.push(unsub);
  }

  // apply
  closer.push(
    watch((get) => {
      const active = get(state).active;
      setElementThemeAttribute(active, element);
    }),
  );

  return () => closer.forEach((v) => v());
}

export const ThemeConnector = () => {
  let state = useThemeState();
  useEffect(() => {
    return hookThemeState({ state });
  }, [state]);
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
