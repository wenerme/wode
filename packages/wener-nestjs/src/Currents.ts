import { AsyncLocalStorage } from 'node:async_hooks';
import { Logger, type Type } from '@nestjs/common';
import { Errors } from '@wener/utils';

export class Currents {
  static readonly #storage = new AsyncLocalStorage<Map<any, any>>();

  static get storage(): AsyncLocalStorage<Map<any, any>> {
    return this.#storage;
  }

  static get store(): Map<any, any> | undefined {
    return this.#storage.getStore();
  }

  static clear(key: Type | string | symbol | any) {
    const store = Currents.getStore();
    return store?.delete(key) ?? false;
  }

  static set<T>(key: Type<T> | string | symbol | any, value: T) {
    Currents.store?.set(key, value);
  }

  static get<T>(key: Type<T> | string | symbol | any, def?: T | (() => T)) {
    const store = Currents.getStore(false);
    const found = store?.get(key);
    if (found === undefined) {
      const neo = def instanceof Function ? def() : def;
      if (!neo !== undefined) {
        store?.set(key, neo);
      }

      return neo;
    }

    return found;
  }

  static getStore(): Map<any, any> | undefined;
  static getStore(require: true): Map<any, any>;
  static getStore(require: boolean): Map<any, any> | undefined;

  static getStore(require = true) {
    const store = this.store;
    if (!store && require) {
      throw Errors.InternalServerError.asError('Currents not ready');
      // store = new Map();
      // this.Store.enterWith(store);
    }

    return store;
  }

  static run<T = void>(
    f: () => T,
    {
      inherit = true,
      store,
    }: {
      inherit?: boolean;
      store?: Map<any, any>;
    } = {},
  ) {
    let last = Currents.store;
    if (inherit && last) {
      if (store) {
        const map = store;
        last.forEach((v, k) => {
          if (!map.has(k)) {
            map.set(k, v);
          }
        });
      } else {
        // clone
        store = new Map(last);
      }
    }
    store ||= new Map();
    return this.#storage.run(store, f);
  }

  static create<T = unknown, K = unknown>(key: K): ContextToken<T, K> {
    return new Token<T, K>(key);
  }
}

export interface ContextToken<T, K> {
  get(def: T | (() => T)): T;

  get(): T | undefined;

  set(value: T): void;

  clear(): boolean;

  require(): T;

  ifPresent<V>(f: (v: T) => V): V | undefined;

  readonly key: K;
}

class Token<T, K> implements ContextToken<T, K> {
  private readonly log;

  constructor(readonly key: K) {
    this.log = new Logger(this.toString());
  }

  toString() {
    const { key } = this;
    return `Token(${String(key instanceof Function ? key.name : key)})`;
  }

  set = (value: T) => {
    Currents.set(this.key, value);
  };

  clear = () => {
    return Currents.clear(this.key);
  };

  get = (def?: any): any => {
    return Currents.get(this.key, def);
  };

  ifPresent = <V>(f: (v: T) => V) => {
    const found = this.get();
    if (found !== undefined) {
      return f(found);
    }
  };

  require = (): T => {
    const found = this.get();
    if (found === undefined) {
      this.log.warn('context value not found');
      throw Errors.InternalServerError.asError(`Context not found: ${this.key}`);
    }

    return found;
  };
}
