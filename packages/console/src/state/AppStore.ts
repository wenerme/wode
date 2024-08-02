import { mutative } from '@wener/reaction/mutative/zustand';
import _ from 'lodash';
import { z } from 'zod';
import { createStore } from 'zustand';

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

export interface AppState {
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

  loadConf(o: AppConf): void;

  logout(): void;

  title: string;
  tid?: string;
  baseUrl: string;
  serverUrl?: string;
  graphql: {
    url?: string;
  };
  matomo?: {
    url?: string;
    siteId?: string;
  };
  features: string[];
  metadata: Record<string, any>;
}

export const AppConf = z.object({
  title: z.string().optional(),
  tid: z.string().optional(),
  baseUrl: z.string().optional(),
  serverUrl: z.string().optional(),
  graphql: z
    .object({
      url: z.string().optional(),
    })
    .optional(),
  matomo: z
    .object({
      url: z.string().optional(),
      siteId: z.string().optional(),
    })
    .optional(),
  features: z.string().array().optional(),
  metadata: z.record(z.any()).optional(),
});
export type AppConf = z.infer<typeof AppConf>;

export function createAppStore() {
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
        features: [],
        metadata: {},
        loadConf(o: AppConf) {
          let c = AppConf.parse(o);
          setState((s) => {
            _.mergeWith(s, c, (a, b) => {
              if (_.isArray(a)) {
                return b;
              }
            });
          });
        },
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
              accessToken: undefined,
              refreshToken: undefined,
              expiresIn: undefined,
              expiresAt: undefined,
            };
          });
        },
      } satisfies AppState;
    }),
  );
}

export type AppStore = ReturnType<typeof createAppStore>;
