import { getGlobalThis } from '@wener/utils';
import { snapshot, subscribe } from 'valtio';
import { proxyWithCompare } from './proxyWithCompare';

export interface ProxyWithOptions<T extends Record<string, any>> {
  initialState: T | ((saved?: T) => T);
  name: string;
  storage?: boolean | IStorage;
  global?: boolean | Record<string, any>;
  broadcast?: boolean | BroadcastChannel;
  proxy?: (v: T) => T;
  globalThis?: any;
}

export function proxyWith<T extends Record<string, any>>({
  initialState,
  name,
  storage,
  globalThis = getGlobalThis(),
  global,
  broadcast,
  proxy = proxyWithCompare,
}: ProxyWithOptions<T>): T {
  let globalHolder;
  if (global === true) {
    globalHolder = globalThis.__GLOBAL_STATES__ ||= {};
  } else if (global && typeof global === 'object') {
    globalHolder = global;
  }
  if (globalHolder?.[name]) {
    return globalHolder[name];
  }

  let load = {} as T;
  let _storage: IStorage | undefined;
  if (storage === true) {
    _storage = globalThis.localStorage;
  } else if (storage) {
    _storage = storage;
  }
  if (_storage) {
    try {
      load = JSON.parse(_storage.getItem(name) || '{}');
    } catch (e) {}
  }

  if (typeof initialState === 'function') {
    load = initialState(load);
  } else {
    load = {
      ...initialState,
      ...load,
    };
  }

  const state = proxy(load);
  const closers: Array<() => void> = [];

  if (_storage) {
    closers.push(
      subscribe(state, () => {
        const val = snapshot(state);
        _storage!.setItem(name, JSON.stringify(val));
      }),
    );
  }

  let bc: BroadcastChannel | undefined;
  if (broadcast === true && 'BroadcastChannel' in globalThis) {
    bc = new globalThis.BroadcastChannel(`valtio:${name}`);
  } else if (typeof broadcast === 'object') {
    bc = broadcast;
  }

  if (bc) {
    const onMessage = (evt: MessageEvent<EventData>) => {
      const { data } = evt;
      if (data.name === name && data.snapshot) {
        try {
          Object.assign(state, JSON.parse(data.snapshot));
        } catch (e) {
          console.error(`[${name}] on broadcast state`, e, evt);
        }
      }
    };
    bc.addEventListener('message', onMessage);
    closers.push(() => bc?.removeEventListener('message', onMessage));
  }

  if (globalHolder) {
    globalHolder[name] = state;
  }

  return state;
}

interface EventData {
  name: string;
  snapshot: string;
}

interface IStorage {
  getItem(key: string): string | null;

  setItem(key: string, value: string): void;
}
