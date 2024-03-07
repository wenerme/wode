'use client';

import React, { useEffect, useRef } from 'react';
import { mutative } from '@wener/reaction/mutative/zustand';
import { createStore, useStore } from 'zustand';

interface SetAuthOptions {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: Date | string;
}

interface AppGlobalState {
  network: {
    online: boolean;
  };
  server: {
    latency: number;
    online: boolean;
  };
  auth: {
    status: 'init' | 'authenticated' | 'unauthenticated' | 'expired';
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    expiresAt?: Date;
  };

  setAuth(o: SetAuthOptions): void;

  logout(): void;
}

function createAppStore() {
  return createStore(
    mutative<AppGlobalState>((setState, getState, store) => {
      return {
        network: {
          online: true,
        },
        server: {
          online: true,
          latency: 0,
        },
        auth: {
          status: 'unauthenticated',
        },
        setAuth(o: SetAuthOptions) {
          setState((s) => {
            s.auth = {
              status: 'authenticated',
              ...o,
              expiresAt: o.expiresAt ? new Date(o.expiresAt) : undefined,
            };
          });
        },
        logout() {
          setState((s) => {
            s.auth = {
              status: 'unauthenticated',
            };
          });
        },
        ready: false,
      } as AppGlobalState;
    }),
  );
}

export type AppGlobalStore = ReturnType<typeof createAppStore>;

export function getAppGlobalStore(): AppGlobalStore {
  const g = ((globalThis as any).__GLOBAL_STATES__ ||= {});
  const key = 'AppGlobalStore';
  return (g[key] ||= createAppStore());
}

export const AppGlobalActor: React.FC<{
  store?: AppGlobalStore;
  actions: {
    refresh: (o: { accessToken: string; refreshToken?: string }) => Promise<{
      accessToken: string;
      refreshToken?: string;
      expiresAt: Date | string;
    }>;
    ping: () => Promise<any>;
  };
  storage?: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    deleteItem: (key: string) => void;
  };
}> = ({ store = getAppGlobalStore(), actions: { refresh, ping }, storage = globalThis.localStorage }) => {
  const setNetworkOnline = (online: boolean) => {
    store.setState((s) => {
      s.network.online = online;
      s.server.online = online;
    });
  };

  useEffect(() => {
    setNetworkOnline(navigator.onLine);

    let handleOffline = () => {
      setNetworkOnline(false);
    };
    let handleOnline = () => {
      setNetworkOnline(true);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [store]);

  const authStatus = useStore(store, (s) => s.auth.status);
  const networkOnline = useStore(store, (s) => s.network.online);
  const serverOnline = useStore(store, (s) => s.server.online);

  const checkServer = async () => {
    if (!store.getState().network.online) {
      store.setState((s) => {
        s.server.online = false;
      });
      return;
    }

    let start = Date.now();
    let online = false;
    try {
      await ping();
      online = true;
    } catch (e) {
      console.error('Failed to ping server', e);
    } finally {
      store.setState((s) => {
        s.server.online = false;
        s.server.latency = Date.now() - start;
      });
    }
    return online;
  };

  const checkAuth = async () => {
    const accessToken = storage.getItem('accessToken');
    const refreshToken = storage.getItem('refreshToken') ?? undefined;
    if (accessToken) {
      try {
        const out = await refresh({ accessToken, refreshToken });
        store.getState().setAuth(out);
        return true;
      } catch (e) {
        console.error('Failed to refresh token', e);

        // server offline, check later
        if (!(await checkServer())) {
          return;
        }
      }
    }
    // not authenticated
    store.setState((s) => {
      s.auth.status = 'unauthenticated';
    });
    return false;
  };

  let authRef = useRef<Promise<any>>();
  const checkAuthOnce = () => {
    // skip
    let state = store.getState();
    // only check for init and authenticated
    if (!state.network.online || !state.server.online || state.auth.status === 'unauthenticated') {
      return;
    }
    // avoid race
    let current = authRef.current;
    if (current) {
      current.then((v) => {
        // authed, skip for now, will check for next
        if (v) {
          authRef.current = undefined;
        } else {
          // check again
          return (current = checkAuth());
        }
        return v;
      });
    } else {
      authRef.current = checkAuth().then((v) => {
        // done
        authRef.current = undefined;
        return v;
      });
    }
  };

  // auth check
  useEffect(() => {
    if (!serverOnline) {
      return;
    }
    checkAuthOnce();
    let timer = setInterval(checkAuthOnce, 5 * 60 * 1000);
    return () => {
      clearInterval(timer);
    };
  }, [store, authStatus, networkOnline, serverOnline]);

  // persist token
  useEffect(() => {
    return store.subscribe((s) => {
      if (s.auth.status !== 'authenticated') {
        return;
      }
      const { accessToken = '', refreshToken } = s.auth;
      if ((storage.getItem('accessToken') ?? '') === accessToken) {
        return;
      }

      accessToken ? storage.setItem('accessToken', accessToken) : storage.deleteItem('accessToken');
      refreshToken ? storage.setItem('refreshToken', refreshToken) : storage.deleteItem('refreshToken');
    });
  }, [store]);

  // ping server if server offline
  useEffect(() => {
    if (serverOnline) {
      return;
    }
    let wait = 5 * 1000;
    const nextWait = () => {
      let v = wait;
      // log increase wait
      wait = Math.min(60 * 1000, wait * 2);
      return v;
    };

    const handleCheck = async () => {
      await checkServer();
      timer = setTimeout(handleCheck, nextWait());
    };
    let timer = setTimeout(handleCheck, nextWait());
    return () => {
      clearTimeout(timer);
    };
  }, [serverOnline]);

  return null;
};
