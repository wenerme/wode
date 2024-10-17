import { createContext, useCallback, useContext, type FC, type ReactNode } from 'react';
import type { ArrayPath, Path, PathValue } from 'react-hook-form';
import { get, set } from '@wener/utils';
import { create as produce } from 'mutative';
import { createStore, useStore, type StoreApi } from 'zustand';

const DefaultContextStore = createStore(() => {
  return {};
});

const Context = createContext<StoreApi<any> | undefined>(undefined);

export const ContextStoreProvider: FC<{ value: StoreApi<any>; children?: ReactNode }> = ({ value, children }) => {
  return <Context.Provider value={value}>{children}</Context.Provider>;
};

function getContextStore() {
  return DefaultContextStore;
}

export function useContextStore<O extends Record<string, any>>(): UseContextStoreReturn<O> {
  const store = useContext(Context) ?? DefaultContextStore;
  return {
    store,
    set(path: string, value: any) {
      store.setState(
        produce((s: any) => {
          set(s, path, value, false);
        }),
      );
    },
    get(path: string): any {
      return get(store.getState(), path);
    },
    useWatch(path: string): any {
      return useStore(
        store,
        useCallback((s) => get(s, path), [path]),
      );
    },
  };
}

export interface UseContextStoreReturn<O extends Record<string, any> = Record<string, any>> {
  store: StoreApi<any>;

  set<P extends Path<O> | ArrayPath<O>, V extends PathValue<O, P>>(type: P, payload: V): void;

  get<P extends Path<O> | ArrayPath<O>, V extends PathValue<O, P>>(path: P): V;

  useWatch<P extends Path<O> | ArrayPath<O>, V extends PathValue<O, P>>(path: P): V;
}
