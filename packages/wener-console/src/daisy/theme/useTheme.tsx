import { createContext, useContext, useEffect, type FC, type ReactNode } from 'react';
import { proxyWithCompare } from '@wener/reaction/valtio';
import { derive } from 'derive-valtio';
import { useSnapshot } from 'valtio';
import { watch } from 'valtio/utils';
import { getPrefersColorSchema } from '../../web/utils';
import { getSupportedThemes } from './getSupportedThemes';
import { setElementThemeAttribute } from './setElementThemeAttribute';

interface ThemeState {
  theme?: string; // 用户选择主题
  light?: string; // 覆盖系统亮色主题
  dark?: string; // 覆盖系统暗色主题

  readonly active: string; // 当前主题
  system?: string; // 当前系统主题 - state self-contained
  custom?: Record<string, any>; // 自定义主题
}

const InitialState = {
  theme: 'system',
  // 修改默认主题色
  light: 'corporate',
  dark: 'business',
};

export function createThemeState(o: Partial<ThemeState> = {}): ThemeState {
  const state = proxyWithCompare<ThemeState>({
    ...InitialState,
    ...o,
  } as any); // as any for readonly active
  // 考虑修改为 Class
  // https://github.com/pmndrs/valtio/pull/647/files
  // fixme avoid using derive
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

const DefaultThemeState = createThemeState();
const ThemeStateContext = createContext(DefaultThemeState);

export function useThemeState() {
  return useContext(ThemeStateContext);
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
  return useSnapshot(useThemeState()).active;
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
      return getSupportedThemes().find((v) => v.value === theme)?.schema ?? 'light';
  }
}

function hookThemeState({
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
    let neo = InitialState;
    try {
      if (s) {
        const { dark = InitialState.dark, light = InitialState.light, theme = InitialState.theme } = JSON.parse(s);
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
    closer.push(() => {
      window.removeEventListener('storage', handleStorageChange);
    });
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

  return () => {
    closer.forEach((v) => {
      v();
    });
  };
}

export const ThemeStateReactor = () => {
  const state = useThemeState();
  useEffect(() => {
    return hookThemeState({ state });
  }, [state]);
  return <></>;
};

export const ThemeProvider: FC<{ children?: ReactNode; state?: ThemeState }> = ({
  children,
  state = DefaultThemeState,
}) => {
  return (
    <ThemeStateContext.Provider value={state}>
      <ThemeStateReactor />
      {children}
    </ThemeStateContext.Provider>
  );
};

function watchPrefersColorSchema(cb: (light: boolean) => void) {
  const listener = (event: MediaQueryListEvent) => {
    cb(event.matches);
  };
  const target = window.matchMedia('(prefers-color-scheme: light)');
  cb(target.matches);
  target.addEventListener('change', listener);
  return () => {
    target.removeEventListener('change', listener);
  };
}
