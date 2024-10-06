import { mutative } from '@wener/reaction/mutative/zustand';
import { getGlobalStates } from '@wener/utils';
import { createStore, useStore } from 'zustand';

export interface UserAgentPreferences {
  colorTheme: 'light' | 'dark';
  contrast: 'no-preference' | 'more' | 'less' | 'custom';
  reducedMotion: 'no-preference' | 'reduce';
  reducedData: 'no-preference' | 'reduce';
  reducedTransparency: 'no-preference' | 'reduce';
  devicePixelRatio: number; // zooming, screen resolution
}

export function getUserAgentPreferenceStore() {
  return getGlobalStates('UserAgentPreferenceStore', () => {
    return createUserAgentPreferenceStore();
  });
}

export function getUserAgentPreferences(): UserAgentPreferences {
  return getUserAgentPreferenceStore().getState();
}

export function useUserAgentPreferences() {
  return useStore(getUserAgentPreferenceStore());
}

function createUserAgentPreferenceStore({ watch = true }: { watch?: boolean } = {}) {
  return createStore(
    mutative<
      UserAgentPreferences & {
        close: () => void;
        reset: () => void;
      }
    >((setState, getState, store) => {
      let initial: UserAgentPreferences = {
        colorTheme: 'light',
        contrast: 'no-preference',
        reducedMotion: 'no-preference',
        reducedData: 'no-preference',
        reducedTransparency: 'no-preference',
        devicePixelRatio: globalThis.devicePixelRatio ?? 1,
      };

      const closer: (() => void)[] = [];
      let reset: () => void = () => undefined;
      if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
      } else {
        let resolution = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
        let prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
        let prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let prefersReducedData = window.matchMedia('(prefers-reduced-data: reduce)');
        let prefersReducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)');
        let prefersContrast = window.matchMedia('(prefers-contrast: more)');

        let set = (out: UserAgentPreferences) => {
          out.colorTheme = prefersColorScheme.matches ? 'dark' : 'light';
          out.reducedMotion = prefersReducedMotion.matches ? 'reduce' : 'no-preference';
          out.reducedData = prefersReducedData.matches ? 'reduce' : 'no-preference';
          out.reducedTransparency = prefersReducedTransparency.matches ? 'reduce' : 'no-preference';
          out.contrast = prefersContrast.matches ? 'more' : 'no-preference';
          out.devicePixelRatio = globalThis.devicePixelRatio ?? 1;
        };

        // initial
        set(initial);

        const allQuery = [
          prefersColorScheme,
          prefersReducedMotion,
          prefersReducedData,
          prefersReducedTransparency,
          prefersContrast,
          resolution,
        ];
        const onChange = () => {
          setState((s) => {
            set(s);
            return s;
          });
        };
        reset = onChange;
        if (watch) {
          for (let query of allQuery) {
            query.addEventListener('change', onChange);
            closer.push(() => query.removeEventListener('change', onChange));
          }
        }
      }

      return {
        ...initial,
        close: () => {
          for (let c of closer) {
            c();
          }
          closer.splice(0, closer.length);
        },
        reset,
      };
    }),
  );
}
