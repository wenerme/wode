import { deepEqual } from '@wener/utils';
import { proxy, unstable_replaceInternalFunction } from 'valtio';
import { isReactComponent } from '../render/isReactComponent';

export function proxyWithCompare<T extends object>(baseObject?: T): T {
  const prevs: Record<string, any> = {};
  unstable_replaceInternalFunction('objectIs', (prev) => {
    prevs.objectIs = prev;
    return deepEqual;
  });
  unstable_replaceInternalFunction('canProxy', (prev) => {
    prevs.canProxy = prev;
    return (x) => {
      if (isReactComponent(x)) {
        // react
        return false;
      }
      if (typeof EventTarget !== 'undefined' && x instanceof EventTarget) {
        // dom
        return false;
      }
      // refSet.has, isArray && !iterator, WeakMap, WeakSet, Error, Number, Date, String, RegExp, ArrayBuffer
      return prev(x);
    };
  });
  let p = proxy(baseObject);
  Object.entries(prevs).forEach(([k, v]) => {
    unstable_replaceInternalFunction(k as 'objectIs', () => v);
  });
  return p;
}
