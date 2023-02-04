import { subscribe } from 'valtio';
import { proxyWithCompare } from './proxyWithCompare';

export interface ProxyWithPersistOptions<T> {
  initialState: T;
  key: string;
  storage?: Storage;
  global?: boolean | Record<string, any>;
  broadcast?: boolean | BroadcastChannel;
}

export function proxyWithPersist<T>({
  initialState,
  key,
  storage = globalThis?.localStorage,
  global = true,
  broadcast = true,
}: ProxyWithPersistOptions<T>): T {
  let globalState;
  if (global === true) {
    globalState = (globalThis as any).__GLOBAL_STATES__ ||= {};
  } else if (global && typeof global === 'object') {
    globalState = global;
  }
  if (globalState?.[key]) {
    return globalState[key];
  }

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
  const closers: Array<() => void> = [];
  if (storage) {
    closers.push(
      subscribe(state, () => {
        storage.setItem(key, JSON.stringify(state));
      }),
    );
  }

  if (globalState) {
    globalState[key] = state;
  }

  // if (typeof BroadcastChannel !== 'undefined' && broadcast === true) {
  //   broadcast = new BroadcastChannel(`valtio:${key}`);
  // }
  // if (broadcast instanceof EventTarget) {
  //   broadcast.addEventListener('message', (e) => {
  //     const { data } = e;
  //     if (data.key === key) {
  //       state[data.path] = data.value;
  //     }
  //   });
  // }

  return state;
}
