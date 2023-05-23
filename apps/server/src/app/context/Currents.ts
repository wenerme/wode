import { AsyncLocalStorage } from 'node:async_hooks';
import { type ExecutionContext, Logger, type Type } from '@nestjs/common';
import { getRequest } from '../auth/getRequest';
import { Errors } from '../error';

export class Currents {
  private static readonly Store = new AsyncLocalStorage<Map<any, any>>();

  static clear(key: Type<any> | string | symbol) {
    const store = Currents.getStore();
    return store.delete(key);
  }

  static set<T>(key: Type<T> | string | symbol, value: T) {
    const store = Currents.getStore();
    store.set(key, value);
  }

  static get<T>(key: Type<T> | string | symbol, def?: T | (() => T)) {
    const store = Currents.getStore();
    const found = store.get(key);
    if (found === undefined) {
      const neo = def instanceof Function ? def() : def;
      if (!neo !== undefined) {
        store.set(key, neo);
      }
      return neo;
    }
    return found;
  }

  static fromExecutionContext(ctx: ExecutionContext) {
    const req = getRequest(ctx);
    return ((req as any).$$Currents ||= new Currents());
  }

  static getStore() {
    const store = this.Store.getStore();
    if (!store) {
      throw Errors.InternalServerError.asException(`Currents not ready`);
      // store = new Map();
      // this.Store.enterWith(store);
    }
    return store;
  }

  static run<T = void>(f: () => T) {
    return this.Store.run(new Map(this.Store.getStore()), f);
  }
}

export function createCurrentToken<T>(key: string | Type<T>): ContextToken<T> {
  return new Token<T>(key);
}

export interface ContextToken<T> {
  get(def?: T | (() => T)): T | undefined;

  set(value: T): void;

  clear(): boolean;

  require(): T;
}

class Token<T> implements ContextToken<T> {
  private readonly log;

  constructor(readonly key: Type<T> | string | symbol) {
    this.log = new Logger(`Token(${String(key instanceof Function ? key.name : key)})`);
  }

  set(value: T) {
    this.log.verbose(`set`);
    Currents.set(this.key, value);
  }

  clear() {
    return Currents.clear(this.key);
  }

  get(def?: T | (() => T)): T | undefined {
    return Currents.get(this.key, def);
  }

  require(): T {
    const found = this.get();
    if (found === undefined) {
      this.log.warn(`context not found`);
      throw Errors.InternalServerError.asException('上下文不存在');
    }
    return found;
  }
}
