import { subscribe } from 'valtio';
import { proxyWithCompare } from './proxyWithCompare';

export function proxyWithPersist<T>({
  initialState,
  key,
  storage = globalThis?.localStorage,
}: {
  initialState: T;
  key: string;
  storage?: Storage;
}): T {
  let load = {};
  if (storage) {
    try {
      load = JSON.parse(storage.getItem(key) || '{}');
    } catch (e) {}
  }
  const state = proxyWithCompare({
    ...initialState,
    ...load,
  });
  if (storage) {
    subscribe(state, () => {
      storage.setItem(key, JSON.stringify(state));
    });
  }
  return state;
}
