import React, { ReactNode, useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { derive, watch } from 'valtio/utils';
import { proxyWithCompare } from '../../valtio';
import { getPrefersColorSchema } from './getPrefersColorSchema';
import { getSupportedThemes } from './getSupportedThemes';
import { setElementThemeAttribute } from './setElementThemeAttribute';

interface ThemeState {
  theme?: string; // 用户选择主题
  light?: string; // 覆盖系统亮色主题
  dark?: string; // 覆盖系统暗色主题

  readonly active: string; // 当前主题
  system?: string; // 当前系统主题 - state self-contained
  // $ele
  // storageKey
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
const ThemeStateContext = React.createContext(DefaultThemeState);

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
  const s = useSnapshot(useThemeState());
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

export const ThemeProvider: React.FC<{ children?: ReactNode; state?: ThemeState }> = ({
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
