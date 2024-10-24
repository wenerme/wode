import { useStore } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';

type ExtractState<S> = S extends {
  getState: () => infer T;
}
  ? T
  : never;
type ReadonlyStoreApi<T> = Pick<StoreApi<T>, 'getState' | 'getInitialState' | 'subscribe'>;

export function createStoreSelectorHook<S extends ReadonlyStoreApi<unknown>>(
  getStore: () => S,
): {
  (): ExtractState<S>;
  <U>(selector: (state: ExtractState<S>) => U): U;
} {
  return function (f) {
    let store = getStore();
    return useStore(store, f as any);
  } as {
    (): ExtractState<S>;
    <U>(selector: (state: ExtractState<S>) => U): U;
  };
}
