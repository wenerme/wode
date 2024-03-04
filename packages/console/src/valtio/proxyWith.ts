import { getVersion, snapshot, subscribe } from 'valtio';
import { proxyWithCompare } from './proxyWithCompare';

export interface ProxyWithOptions<T extends Record<string, any>> {
  initialState: T | ((saved?: T) => T);
  name: string;
  storage?: boolean | IStorage;
  global?: boolean | Record<string, any>;
  broadcast?: boolean | BroadcastChannel;
  proxy?: (v: T) => T;
}

export function proxyWith<T extends Record<string, any>>({
  initialState,
  name,
  storage,
  global,
  broadcast,
  proxy = proxyWithCompare,
}: ProxyWithOptions<T>): T {
  let globalHolder;
  if (global === true) {
    const g: Record<string, any> = typeof window !== 'undefined' ? window : proxyWith;
    globalHolder = g.__GLOBAL_STATES__ ||= {};
  } else if (global && typeof global === 'object') {
    globalHolder = global;
  }
  {
    const found = globalHolder?.[name] as T | undefined;
    if (found) {
      // NodeJS 可能会有问题, 避免放在 global
      if (getVersion(found) === undefined) {
        console.warn(`[${name}] global state is not a proxy, please use proxyWith instead`);
      } else {
        return found;
      }
    }
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
    } catch (e) {
      // ok
    }
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
  if (getVersion(state) === undefined) {
    console.error(`[${name}] proxy result is not a proxy state`);
  }
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
  if (broadcast === true) {
    bc = new BroadcastChannel(`valtio:${name}`);
  } else if (broadcast) {
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
