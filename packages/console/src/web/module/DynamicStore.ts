import { get, set } from '@wener/utils';
import { createStore, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ModuleStore } from './types';

export class DynamicStore implements ModuleStore {
  constructor(
    readonly store: StoreApi<any> = createStore(
      immer(() => {
        return {};
      }),
    ),
  ) {}

  get value() {
    return this.store.getState();
  }

  add(type: string, payload: any) {
    this.store.setState((s) => {
      let last = get(s, type, []);
      if (!Array.isArray(last)) {
        last = [last];
      }
      Array.isArray(payload) ? last.push(...payload) : last.push(payload);
      set(s, type, last, false);
    });
  }

  collect(type: string): any {
    let found = get(this.value, type) ?? [];
    if (!Array.isArray(found)) {
      found = [found];
    }
    return found;
  }

  set(key: string, value: any, { merge } = {}) {
    this.store.setState((s) => {
      set(s, key, value, merge);
    });
  }

  get(key: string): any {
    return get(this.value, key);
  }

  as() {
    return this as any;
  }
}
