import { AsyncLocalStorage } from 'node:async_hooks';
import { type MaybePromise } from '@wener/utils';
import { type HttpRequestLog } from './HttpRequestLog';

export class FetchCache {
  private static readonly Storage = new AsyncLocalStorage<FetchCacheConfig>();

  static get() {
    return this.Storage.getStore()?.last;
  }

  static set(v: HttpRequestLog, hit: boolean) {
    const store = this.Storage.getStore();
    if (store) {
      store.last = v;
      store.lastHit = hit;
    }
  }

  static getConfig() {
    return this.Storage.getStore();
  }

  static isLastHit() {
    return this.Storage.getStore()?.lastHit;
  }

  static skip<T = void>(f: () => MaybePromise<T>) {
    return this.Storage.run({ ...this.Storage.getStore(), use: 'request' }, f);
  }

  static fallback<T = void>(conf: FetchCacheConfig, f: () => MaybePromise<T>) {
    return this.Storage.run({ ...conf, ...this.Storage.getStore() }, f);
  }

  static run<T = void>(conf: FetchCacheConfig, f: () => MaybePromise<T>) {
    return this.Storage.run({ ...this.Storage.getStore(), ...conf }, f);
  }
}

export interface FetchCacheConfig {
  expires?: string;
  use?: 'request' | 'cache' | 'cache-only' | string;
  last?: HttpRequestLog;
  lastHit?: boolean;

  match?: {
    cookie?: boolean;
  };

  onBeforeRequest?: (o: FetchCacheHookContext) => void;
  onBeforeFetch?: (o: FetchCacheHookContext) => void;
  onAfterRequest?: (o: FetchCacheHookContext) => void;
}

export interface FetchCacheHookContext {
  entry: HttpRequestLog;
  config: FetchCacheConfig;
  init: RequestInit;
  hit: boolean;
}
