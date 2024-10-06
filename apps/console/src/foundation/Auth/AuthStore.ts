import { useEffect, useRef, type FC } from 'react';
import { useNetworkStatus } from '@wener/console';
import { getGlobalStates } from '@wener/utils';
import { createStore } from 'zustand';
import { mutative } from 'zustand-mutative';

export const AuthStatus = {
  Init: 'Init',
  Authenticated: 'Authenticated',
  Unauthenticated: 'Unauthenticated',
  Expired: 'Expired',
  Loading: 'Loading',
  Error: 'Error',
  Locked: 'Locked',
} as const;
type AuthStatusCode = (typeof AuthStatus)[keyof typeof AuthStatus];

interface SetAuthOptions {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: Date | string;
}

interface AuthStoreState {
  status: AuthStatusCode;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: Date;
  error?: any;

  setAuth(o: SetAuthOptions): void;

  reset(): void;
}

type AuthStore = ReturnType<typeof createAuthStore>;

function createAuthStore() {
  return createStore(
    mutative<AuthStoreState>((setState, getState, store) => {
      return {
        status: AuthStatus.Init,
        setAuth(o: SetAuthOptions) {
          setState((s) => {
            Object.assign(s, {
              status: AuthStatus.Authenticated,
              ...o,
              expiresAt: o.expiresAt ? new Date(o.expiresAt) : undefined,
            });
          });
        },
        reset() {
          setState((s) => {
            Object.assign(s, {
              status: AuthStatus.Unauthenticated,
              accessToken: undefined,
              refreshToken: undefined,
              expiresIn: undefined,
              expiresAt: undefined,
              error: undefined,
            });
          });
        },
      };
    }),
  );
}

type AuthSidecarProps = {
  store: AuthStore;
  actions: {
    refresh: (o: { accessToken: string; refreshToken?: string }) => Promise<{
      accessToken: string;
      refreshToken?: string;
      expiresAt: Date | string;
    }>;
  };
  storage?: Storage;
};

function useAuthSidecar({ store, actions: { refresh }, storage = localStorage }: AuthSidecarProps) {
  const { online } = useNetworkStatus();
  // todo watch storage ?
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
      }
    }
    // not authenticated or server error
    store.getState().reset();
    return false;
  };

  const authRef = useRef<Promise<boolean>>();

  const doAuthCheck = () => {
    const state = store.getState();
    // only check for init and authenticated
    switch (state.status) {
      case AuthStatus.Init:
      case AuthStatus.Authenticated:
        break;
      default:
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
    if (!online) return;
    doAuthCheck();
    const timer = setInterval(doAuthCheck, 5 * 60 * 1000);
    return () => {
      clearInterval(timer);
    };
  }, [store, online]);

  //
  useAuthTokenPersist(store, storage);
}

const AuthStoreStateKey = 'AuthStore';

export const AuthSidecar: FC<Omit<AuthSidecarProps, 'store'>> = (props) => {
  let store = useAuthStore();
  useAuthSidecar({
    store,
    ...props,
  });
  return null;
};

function useAuthTokenPersist(store: AuthStore, storage: Storage) {
  const ref = useRef(storage);
  ref.current = storage;
  // persist token
  useEffect(() => {
    return store.subscribe((s) => {
      if (s.status !== AuthStatus.Authenticated) {
        return;
      }
      const { accessToken = '', refreshToken } = s;

      const storage = ref.current;
      if ((storage.getItem('accessToken') ?? '') === accessToken) {
        return;
      }

      accessToken ? storage.setItem('accessToken', accessToken) : deleteItem(storage, 'accessToken');
      refreshToken ? storage.setItem('refreshToken', refreshToken) : deleteItem(storage, 'refreshToken');
    });
  }, [store]);
}

export function useAuthStore() {
  // return useContext(Context) ?? getAuthStore();
  return getAuthStore();
}

export function getAuthStore() {
  return getGlobalStates(AuthStoreStateKey, () => {
    return createAuthStore();
  });
}

export function getAuthState() {
  return getAuthStore().getState();
}

export function getAccessToken() {
  return getAuthState().accessToken;
}

function deleteItem(s: any, key: string) {
  if ('removeItem' in s) {
    s.removeItem(key);
  } else {
    delete s[key];
  }
}
