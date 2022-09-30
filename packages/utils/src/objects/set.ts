import { ObjectKey, ObjectPath, parseObjectPath } from './parseObjectPath';

/**
 * Deep set
 *
 * {@link https://github.com/lukeed/dset dset}
 */
export function set<T extends object, V>(obj: T, key: ObjectKey | ObjectPath, val: V, merging = true) {
  const path = parseObjectPath(key);
  let i = 0;
  const len = path.length;
  let current: any = obj;
  let x, k;
  while (i < len) {
    k = path[i++];
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') break;
    // noinspection PointlessArithmeticExpressionJS
    current = current[k] =
      i === len
        ? merging
          ? merge(current[k], val)
          : val
        : typeof (x = current[k]) === typeof path
        ? x
        : // @ts-ignore hacky type check
        path[i] * 0 !== 0 || !!~('' + path[i]).indexOf('.')
        ? {}
        : [];
  }
}

export function merge(a: any, b: any) {
  let k;
  if (typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      for (k = 0; k < b.length; k++) {
        a[k] = merge(a[k], b[k]);
      }
    } else {
      for (k in b) {
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') break;
        a[k] = merge(a[k], b[k]);
      }
    }
    return a;
  }
  return b;
}
