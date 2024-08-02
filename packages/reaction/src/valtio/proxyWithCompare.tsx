import { deepEqual } from '@wener/utils';
import { unstable_buildProxyFunction } from 'valtio';
import { isReactComponent } from '../render/isReactComponent';

/*
https://github.com/pmndrs/valtio/blob/a6ed245763ac7bba6dc7541d7e505404a9d5f14a/src/vanilla.ts#L55-L79
objectIs, newProxy, canProxy, shouldTrapDefineProperty, defaultHandlePromise, snapCache,createSnapshot , proxyCache, versionHolder, proxyFunction

[
    // public functions
    proxyFunction,
    // shared state
    proxyStateMap,
    refSet,
    // internal things
    objectIs,
    newProxy,
    canProxy,
    shouldTrapDefineProperty,
    defaultHandlePromise,
    snapCache,
    createSnapshot,
    proxyCache,
    versionHolder,
  ]
 */

const canProxyOrig = unstable_buildProxyFunction()[5];
export const proxyWithCompare = unstable_buildProxyFunction(deepEqual, undefined, (x) => {
  if (isReactComponent(x)) {
    // react
    return false;
  }
  if (typeof EventTarget !== 'undefined' && x instanceof EventTarget) {
    // dom
    return false;
  }

  // 不会 proxy 的类型
  // refSet.has, isArray && !iterator, WeakMap, WeakSet, Error, Number, Date, String, RegExp, ArrayBuffer
  return canProxyOrig(x);
})[0];
