import { unstable_buildProxyFunction } from 'valtio';
import { deepEqual } from '@wener/utils';

const canProxyOrig = unstable_buildProxyFunction()[5];
export const proxyWithCompare = unstable_buildProxyFunction(deepEqual, undefined, (x: any) => {
  if (!x) {
    return false;
  }
  // react-is
  // https://github.com/facebook/react/blob/main/packages/react-is/src/ReactIs.js
  // https://github.com/facebook/react/blob/main/packages/shared/ReactSymbols.js
  if (typeof x?.['$$typeof'] === 'symbol') {
    return false;
  }
  if (globalThis.EventTarget && x instanceof EventTarget) {
    // dom
    return false;
  }
  // 不会 proxy 的类型
  // refSet, isArray && !iterator, WeakMap, WeakSet, Error, Number, Date, String, RegExp, ArrayBuffer
  return canProxyOrig(x);
})[0];
