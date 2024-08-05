import { computeIfAbsent, getGlobalThis } from '@wener/utils';

let _holder: any;

export function setGlobalStates(states: Record<string, any>) {
  _holder = states;
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
