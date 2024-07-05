import { mutative } from '@wener/reaction/mutative/zustand';
import { createStore } from 'zustand';
import { getGlobalStates } from '@/state/index';

interface SetAuthOptions {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: Date | string;
}

export enum AuthStatus {
  Init = 'Init',
  Authenticated = 'Authenticated',
  Unauthenticated = 'Unauthenticated',
  Expired = 'Expired',
}

interface AppState {
  network: {
    online: boolean;
  };
  server: {
    latency: number;
    online: boolean;
  };
  auth: {
    status: AuthStatus;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    expiresAt?: Date;
  };

  setAuth(o: SetAuthOptions): void;

  logout(): void;

  title: string;
  tid?: string;
  baseUrl: string;
  graphql: {
    url?: string;
  };
  matomo?: {
    url?: string;
    siteId?: string;
  };
}

function createAppStore() {
  return createStore(
    mutative<AppState>((setState, getState, store) => {
      return {
        title: '',
        baseUrl: typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin,
        network: {
          online: true,
        },
        server: {
          online: true,
          latency: 0,
        },
        auth: {
          status: AuthStatus.Init,
        },
        graphql: {},
        matomo: {},
        setAuth(o: SetAuthOptions) {
          setState((s) => {
            s.auth = {
              status: AuthStatus.Authenticated,
              ...o,
              expiresAt: o.expiresAt ? new Date(o.expiresAt) : undefined,
            };
          });
        },
        logout() {
          setState((s) => {
            s.auth = {
              status: AuthStatus.Unauthenticated,
            };
          });
        },
      } satisfies AppState;
    }),
  );
}

export type AppStore = ReturnType<typeof createAppStore>;

export function getAppState(): AppState {
  return getAppStore().getState();
}

export function getAppStore(): AppStore {
  return getGlobalStates('AppStore', createAppStore);
}

export interface AppActions {
  refresh: (o: { accessToken: string; refreshToken?: string }) => Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date | string;
  }>;
  ping: () => Promise<any>;
}
