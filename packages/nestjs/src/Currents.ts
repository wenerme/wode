import { AsyncLocalStorage } from 'node:async_hooks';
import { Logger, type Type } from '@nestjs/common';
import { Errors } from './Errors';

export class Currents {
  private static readonly store = new AsyncLocalStorage<Map<any, any>>();

  static clear(key: Type<any> | string | symbol) {
    const store = Currents.getStore();
    return store.delete(key);
  }

  static set<T>(key: Type<T> | string | symbol, value: T) {
    const store = Currents.getStore();
    store.set(key, value);
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

  static getStore(): Map<any, any>;
  static getStore(require: true): Map<any, any>;
  static getStore(require: boolean): Map<any, any> | undefined;

  static getStore(require = true) {
    const store = this.store.getStore();
    if (!store && require) {
      throw Errors.InternalServerError.asException(`Currents not ready`);
      // store = new Map();
      // this.Store.enterWith(store);
    }
    return store;
  }

  static run<T = void>(f: () => T) {
    return this.store.run(new Map(this.store.getStore()), f);
  }

  static create<T>(key: string | Type<T>): ContextToken<T> {
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

  set(value: T) {
    Currents.set(this.key, value);
  }

  clear() {
    return Currents.clear(this.key);
  }

  get(): T | undefined;
  get(def: T | (() => T)): T;
  get(def?: T | (() => T)): T | undefined {
    return Currents.get(this.key, def);
  }

  require(): T {
    const found = this.get();
    if (found === undefined) {
      this.log.warn(`context value not found`);
      throw Errors.InternalServerError.asException('上下文不存在');
    }
    return found;
  }
}
