import { cache } from 'react';
import { computeIfAbsent, getGlobalStates, maybeFunction, type MaybeFunction } from '@wener/utils';

let _holder: any = typeof window === 'undefined' ? cache(() => ({})) : getGlobalStates();

export function setContextStates(states: Record<string, any>): Record<string, any>;
export function setContextStates<V = any>(key: string, value: V): V | undefined;
export function setContextStates(a: any, b?: any) {
  if (typeof a === 'string') {
    let s = getContextStates();
    const last = s[a];
    s[a] = b;
    return last;
  } else if (typeof a === 'object') {
    _holder = a;
  }
}

export function getContextStates(): Record<string, any>;
export function getContextStates<T>(key: string, create: () => T): T;
export function getContextStates<T>(key: string): T | undefined;
export function getContextStates(key?: string, create?: () => any): any {
  if (key) {
    if (!create) {
      return _holder[key];
    }
    return computeIfAbsent(_holder, key, create);
  }
  return _holder;
}

export const createServerContext = <T>(defaultValue: MaybeFunction<T>): [() => T, (v: T) => void] => {
  const getRef = cache(() => ({ current: maybeFunction(defaultValue) }));
  const getValue = (): T => getRef().current;
  const setValue = (value: T) => {
    getRef().current = value;
  };

  return [getValue, setValue];
};
