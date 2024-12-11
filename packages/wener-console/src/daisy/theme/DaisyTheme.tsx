import { useContext, useEffect } from 'react';
import { deepEqual } from '@wener/utils';
import { z } from 'zod';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { getPrefersColorSchema } from '../../utils/getPrefersColorSchema';
import { getSupportedThemes } from './getSupportedThemes';
import { setElementThemeAttribute } from './setElementThemeAttribute';
import { DaisyThemeStoreContext, type DaisyThemeStoreState } from './useTheme';

type Updator<T> = (update: Partial<T> | ((state: T) => void)) => void;
export namespace DaisyTheme {
  const Context = DaisyThemeStoreContext;

  type RootProps = {};
  export const Root = () => {
    return;
  };

  export function useThemeStore() {
    return useContext(Context);
  }

  export function useThemeState(): [DaisyThemeStoreState, Updator<DaisyThemeStoreState>] {
    let store = useThemeStore();
    const state = useStore(
      store,
      useShallow((s) => s),
    );

    return [
      state,
      (update) => {
        store.setState(update);
      },
    ];
  }

  export const Sidecar = () => {
    const store = useContext(Context);

    useEffect(() => {
      const storage = globalThis.localStorage;
      if (!storage && typeof window === 'undefined') {
        return;
      }

      const StateSchema = z.object({
        light: z.string().optional(),
        dark: z.string().optional(),
        theme: z.string().optional(),
        custom: z.record(z.any()).optional(),
      });

      const closer: Array<() => void> = [];

      const loadState = (s: string | null) => {
        if (!s) {
          return;
        }
        try {
          const loaded = StateSchema.parse(JSON.parse(s));
          store.setState(loaded, true);
        } catch (e) {
          console.warn('Failed to parse theme state', e);
        }
      };

      const storageKey = 'THEME_STATE';
      // load previous
      loadState(storage.getItem(storageKey));

      // watch storage change
      {
        const handleStorageChange = (e: StorageEvent) => {
          if (e.key !== storageKey) {
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
        store.setState((s) => {
          s.system = getPrefersColorSchema();
        });
        closer.push(
          watchPrefersColorSchema(() => {
            store.setState((s) => {
              s.system = getPrefersColorSchema();
            });
          }),
        );
      }
      // persist
      {
        let last = StateSchema.parse(store.getState());
        const unsub = store.subscribe((s) => {
          const current = StateSchema.parse(s);
          if (deepEqual(last, current)) {
            return;
          }
          storage.setItem(storageKey, JSON.stringify(current));
          last = current;
        });
        //
        closer.push(unsub);
      }

      // active
      {
        // const element = document.documentElement;
        store.subscribe((s) => {
          let active = getActiveTheme(s);
          let schema = getThemeSchema(active);
          if (s.active === active && s.schema === schema) {
            return;
          }
          store.setState({ active, schema });
          const el = globalThis.document?.documentElement;
          // setElementThemeAttribute(active, element);
          el?.setAttribute('data-theme', active);
          el?.setAttribute('data-color-mode', schema);
        });
      }

      return () => {
        closer.forEach((c) => c());
      };
    }, [store]);

    /*
    data-color-mode="dark"
     */

    return null;
  };

  export function useThemeSchema(): 'light' | 'dark' {
    let store = useThemeStore();
    return useStore(store, ({ theme }) => {
      return getThemeSchema(theme);
    });
  }
}

function getThemeSchema(theme: string | undefined) {
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

function getActiveTheme(s: { theme?: string; light?: string; dark?: string; system?: string }) {
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
