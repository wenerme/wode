import { computeIfAbsent, getGlobalStates } from '@wener/utils';
import { merge } from 'es-toolkit';
import { createStore } from 'zustand';
import { mutative } from 'zustand-mutative';
import { createStoreSelectorHook } from '../../zustand';

export interface SiteConfInit extends Partial<SiteConf> {}

export interface SiteConf {
  title: string;
  tid?: string;
  baseUrl: string;
  serverUrl?: string;
  graphqlUrl?: string;
  features: string[];
  metadata: Record<string, any>;
}

interface SiteStoreState extends SiteConf {
  load(init: SiteConfInit): void;
}

function createSiteStore() {
  return createStore(
    mutative<SiteStoreState>((setState, getState, store) => {
      return {
        title: '',
        baseUrl: typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin,
        metadata: {},
        features: [],
        load(init?: SiteConfInit) {
          if (!init) {
            return;
          }
          setState((s) => {
            merge(s, init);
          });
        },
      } as SiteStoreState;
    }),
  );
}

export type SiteStore = ReturnType<typeof createSiteStore>;

export function getSiteState(): SiteStoreState {
  return getSiteStore().getState();
}

export function getSiteStore(): SiteStore {
  return computeIfAbsent(getGlobalStates(), 'SiteStore', createSiteStore);
}

export const useSiteStore = createStoreSelectorHook<SiteStore>(getSiteStore);
