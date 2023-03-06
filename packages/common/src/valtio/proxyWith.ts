import { subscribe } from 'valtio';
import { proxyWithCompare } from './proxyWithCompare';

export interface ProxyWithOptions<T extends Record<string, any>> {
  initialState: T;
  name: string;
  storage?: boolean | IStorage;
  global?: boolean | Record<string, any>;
  broadcast?: boolean | BroadcastChannel;
}

export function proxyWith<T extends Record<string, any>>({
  initialState,
  name,
  storage: _storage,
  global: _global,
  broadcast,
}: ProxyWithOptions<T>): T {
  let globalHolder;
  if (_global === true) {
    globalHolder = (globalThis as any).__GLOBAL_STATES__ ||= {};
  } else if (_global && typeof _global === 'object') {
    globalHolder = _global;
  }
  if (globalHolder?.[name]) {
    return globalHolder[name];
  }

  let load = {};
  let storage: IStorage | undefined;
  if (_storage === true) {
    storage = globalHolder?.localStorage;
  } else if (_storage) {
    storage = _storage;
  }
  if (storage) {
    try {
      load = JSON.parse(storage.getItem(name) || '{}');
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
        storage!.setItem(name, JSON.stringify(state));
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
    let onMessage = (evt: MessageEvent<EventData>) => {
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
