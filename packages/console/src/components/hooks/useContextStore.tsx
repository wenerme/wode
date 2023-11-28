import React, { createContext, ReactNode, useCallback, useContext } from 'react';
import type { ArrayPath, Path, PathValue } from 'react-hook-form';
import { get, set } from '@wener/utils';
import { produce } from 'immer';
import { createStore, StoreApi, useStore } from 'zustand';

const DefaultStore = createStore(() => {
  return {};
});

const Context = createContext<StoreApi<any> | undefined>(undefined);

function useModuleStore() {
  return useContext(Context) ?? DefaultStore;
}

export const ContextStoreProvider: React.FC<{ value: StoreApi<any>; children?: ReactNode }> = ({ value, children }) => {
  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export function useContextStore<O extends Record<string, any>>(): ModuleContextHooks<O> {
  const store = useModuleStore();
  return {
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

export interface ModuleContextHooks<O extends Record<string, any> = Record<string, any>> {
  set<P extends Path<O> | ArrayPath<O>, V extends PathValue<O, P>>(type: P, payload: V): void;

  get<P extends Path<O> | ArrayPath<O>, V extends PathValue<O, P>>(path: P): V;

  useWatch<P extends Path<O> | ArrayPath<O>, V extends PathValue<O, P>>(path: P): V;
}
