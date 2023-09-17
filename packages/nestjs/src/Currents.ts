import { AsyncLocalStorage } from 'node:async_hooks';
import { Logger, type Type } from '@nestjs/common';
import { Errors } from './Errors';

export class Currents {
  static readonly #storage = new AsyncLocalStorage<Map<any, any>>();

  static get storage(): AsyncLocalStorage<Map<any, any>> {
    return this.#storage;
  }

  static get store(): Map<any, any> | undefined {
    return this.#storage.getStore();
  }

  static clear(key: Type | string | symbol) {
    const store = Currents.getStore();
    return store?.delete(key) ?? false;
  }

  static set<T>(key: Type<T> | string | symbol, value: T) {
    Currents.store?.set(key, value);
  }

  static get<T>(key: Type<T> | string | symbol, def?: T | (() => T)) {
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
      throw Errors.InternalServerError.asException('Currents not ready');
      // store = new Map();
      // this.Store.enterWith(store);
    }

    return store;
  }

  static run<T = void>(
    f: () => T,
    {
      inherit = true,
      init = inherit ? this.#storage.getStore() : new Map(),
    }: {
      inherit?: boolean;
      init?: Map<any, any>;
    } = {},
  ) {
    return this.#storage.run(new Map(init), f);
  }

  static create<T = unknown>(key: string | Type<T>): ContextToken<T> {
    return new Token<T>(key);
  }
}

export interface ContextToken<T> {
  get(def: T | (() => T)): T;

  get(): T | undefined;

  set(value: T): void;

  clear(): boolean;

  require(): T;
}

class Token<T> implements ContextToken<T> {
  private readonly log;

  constructor(readonly key: Type<T> | string | symbol) {
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

  require = (): T => {
    const found = this.get();
    if (found === undefined) {
      this.log.warn('context value not found');
      throw Errors.InternalServerError.asException('上下文不存在');
    }

    return found;
  };
}
