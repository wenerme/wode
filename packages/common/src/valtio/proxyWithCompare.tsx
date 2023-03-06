import { typeOf } from 'react-is';
import { unstable_buildProxyFunction } from 'valtio';
import { deepEqual } from '@wener/utils';

const canProxyOrig = unstable_buildProxyFunction()[5];
export const proxyWithCompare = unstable_buildProxyFunction(deepEqual, undefined, (x) => {
  if (typeOf(x)) {
    // react
    return false;
  }
  if (typeof EventTarget !== 'undefined' && x instanceof EventTarget) {
    // dom
    return false;
  }
  // if (
  //   (typeof HTMLElement === 'undefined' && x instanceof HTMLElement) ||
  //   (typeof SVGElement === 'undefined' && x instanceof SVGElement) ||
  //   x instanceof Node
  // ) {
  //   // dom
  //   return false;
  // }

  // 不会 proxy 的类型
  // refSet, isArray && !iterator, WeakMap, WeakSet, Error, Number, Date, String, RegExp, ArrayBuffer
  return canProxyOrig(x);
})[0];

// function isNode(o: any): o is Node {
//   return typeof Node === 'object'
//     ? o instanceof Node
//     : o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName === 'string';
// }
//
// // Returns true if it is a DOM element
// function isDomElement(o: any): o is HTMLElement {
//   return typeof HTMLElement === 'object'
//     ? o instanceof HTMLElement // DOM2
//     : o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName === 'string';
// }
