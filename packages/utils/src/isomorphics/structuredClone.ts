/* eslint no-proto:0 */
import { classOf } from '../langs/classOf';
import { globalThis } from './globalThis';

/**
 * Clone an object using structured cloning algorithm
 *
 * - Chrome 98, Safari 15.4, NodeJS 17
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/structuredClone structuredClone}
 * @see {@link https://github.com/zloirock/core-js/blob/master/packages/core-js/modules/web.structured-clone.js core-js}
 */
export const structuredClone: <T>(value: T, options?: StructuredSerializeOptions) => T =
  globalThis.structuredClone || _clone;

function set(obj: any, key: any, val: any) {
  if (typeof val.value === 'object') val.value = _clone(val.value);
  if (!val.enumerable || val.get || val.set || !val.configurable || !val.writable || key === '__proto__') {
    Object.defineProperty(obj, key, val);
  } else obj[key] = val.value;
}

/**
 * @see {@link https://github.com/lukeed/klona/blob/master/src/full.js klona}
 */
export function _clone(x: any): any {
  // too complex
  // https://github.com/zloirock/core-js/blob/master/packages/core-js/modules/web.structured-clone.js

  if (typeof x !== 'object') return x;

  let i = 0;
  let k;
  let list;
  let tmp: any;
  const str = classOf(x);
  switch (str) {
    case 'Array':
      tmp = Array(x.length);
      break;
    case 'Object':
      tmp = Object.create(x.__proto__ || null);
      break;
    case 'Set':
      tmp = new Set();
      x.forEach(function (val: any) {
        tmp.add(_clone(val));
      });
      break;
    case 'Map':
      tmp = new Map();
      x.forEach(function (val: any, key: any) {
        tmp.set(_clone(key), _clone(val));
      });
      break;
    case 'Date':
      tmp = new Date(+x);
      break;
    case 'RegExp':
      tmp = new RegExp(x.source, x.flags);
      break;
    case 'DataView':
      tmp = new x.constructor(_clone(x.buffer));
      break;
    case 'ArrayBuffer':
      tmp = x.slice(0);
      break;
    default:
      // typed arrays
      if (str.endsWith('Array')) {
        // ArrayBuffer.isView(x)
        // ~> `new` bcuz `Buffer.slice` => ref
        tmp = new x.constructor(x);
      }
  }

  if (tmp) {
    for (list = Object.getOwnPropertySymbols(x); i < list.length; i++) {
      set(tmp, list[i], Object.getOwnPropertyDescriptor(x, list[i]));
    }

    for (i = 0, list = Object.getOwnPropertyNames(x); i < list.length; i++) {
      if (Object.hasOwnProperty.call(tmp, (k = list[i])) && tmp[k] === x[k]) continue;
      set(tmp, k, Object.getOwnPropertyDescriptor(x, k));
    }
  }

  return tmp || x;
}
