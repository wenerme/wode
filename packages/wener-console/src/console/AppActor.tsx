import { useCallback, useEffect, useRef, type FC, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { LoadingIndicator } from '../loader';
import { AuthStatus, type AppStore } from '../state';
import { getAppStore } from './container';

interface Storage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
}

export interface AppActions {
  refresh: (o: { accessToken: string; refreshToken?: string }) => Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date | string;
  }>;
  ping: () => Promise<any>;
}

export const AppActor: FC<{
  store?: AppStore;
  actions: AppActions;
  storage?: Storage;
}> = ({ store = getAppStore(), actions: { refresh, ping }, storage = globalThis.localStorage }) => {
  useNetworkStatusWatch(store);

  const authStatus = useStore(store, (s) => s.auth.status);
  const networkOnline = useStore(store, (s) => s.network.online);
  const serverOnline = useStore(store, (s) => s.server.online);

  const doServerCheck = async () => {
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
        if (!(await doServerCheck())) {
          return;
        }
      }
    }
    // not authenticated
    store.setState((s) => {
      s.auth.status = AuthStatus.Unauthenticated;
    });
    return false;
  };

  let authRef = useRef<Promise<any>>();
  const doAuthCheck = () => {
    // skip
    let state = store.getState();
    // only check for init and authenticated
    if (!state.network.online || !state.server.online || state.auth.status === AuthStatus.Unauthenticated) {
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
    doAuthCheck();
    let timer = setInterval(doAuthCheck, 5 * 60 * 1000);
    return () => {
      clearInterval(timer);
    };
  }, [store, authStatus, networkOnline, serverOnline]);

  useAuthTokenPersist(store, storage);
  useServerStatusWatch(store, doServerCheck);
  return null;
};

function deleteItem(s: any, key: string) {
  if ('removeItem' in s) {
    s.removeItem(key);
  } else {
    delete s[key];
  }
}

function useAuthTokenPersist(store: AppStore, storage: Storage) {
  let ref = useRef(storage);
  ref.current = storage;
  // persist token
  useEffect(() => {
    return store.subscribe((s) => {
      if (s.auth.status !== AuthStatus.Authenticated) {
        return;
      }
      const { accessToken = '', refreshToken } = s.auth;

      const storage = ref.current;
      if ((storage.getItem('accessToken') ?? '') === accessToken) {
        return;
      }

      accessToken ? storage.setItem('accessToken', accessToken) : deleteItem(storage, 'accessToken');
      refreshToken ? storage.setItem('refreshToken', refreshToken) : deleteItem(storage, 'refreshToken');
    });
  }, [store]);
}

function useNetworkStatusWatch(store: AppStore) {
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
}

function useServerStatusWatch(store: AppStore, checkServer: () => Promise<any>) {
  const serverOnline = useStore(store, (s) => s.server.online);

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
}

export const AuthReady: FC<{ children?: ReactNode }> = ({ children }) => {
  const ready = useStore(
    getAppStore(),
    useCallback((s) => s.auth.status !== AuthStatus.Init, []),
  );
  if (ready) {
    return children;
  }
  return <LoadingIndicator />;
};

export function clearAuthToken(storage: Storage = localStorage) {
  deleteItem(storage, 'accessToken');
}
