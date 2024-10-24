import { computeIfAbsent } from '../objects/computeIfAbsent';
import { getGlobalThis } from '../web/getGlobalThis';

let _holder: any;

export function setGlobalStates(states: Record<string, any>): Record<string, any>;
export function setGlobalStates<V = any>(key: string, value: V): V | undefined;
export function setGlobalStates(a: any, b?: any) {
  if (typeof a === 'string') {
    let s = getGlobalStates();
    const last = s[a];
    s[a] = b;
    return last;
  } else if (typeof a === 'object') {
    _holder = a;
  }
}

export function getGlobalStates(): Record<string, any>;
export function getGlobalStates<T>(key: string, create: () => T): T;
export function getGlobalStates<T>(key: string): T | undefined;
export function getGlobalStates(key?: string, create?: () => any): any {
  _holder ||= (getGlobalThis() as any).__GLOBAL_STATES__ ||= {};
  if (key) {
    if (!create) {
      return _holder[key];
    }
    return computeIfAbsent(_holder, key, create);
  }
  return _holder;
}
