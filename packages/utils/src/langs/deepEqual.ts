const has = Object.prototype.hasOwnProperty;
const hasElementType = typeof Element !== 'undefined';

function find(iter: any, tar: any, key?: any) {
  for (key of iter.keys()) {
    if (deepEqual(key, tar)) return key;
  }
}

/**
 * deep equal - support react, dom, Date, RegExp, Array, ArrayBuffer, Set, Map, Object
 * @see {@link https://github.com/lukeed/dequal/blob/master/src/lite.js dequal/src/lite.js}
 * @see {@link https://github.com/FormidableLabs/react-fast-compare/blob/master/index.js react-fast-compare/index.js}
 */
export function deepEqual(foo: any, bar: any) {
  let ctor, len, tmp;
  if (foo === bar) return true;

  if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
    if (ctor === Date) return foo.getTime() === bar.getTime();
    if (ctor === RegExp) return foo.toString() === bar.toString();

    if (ctor === Array) {
      if ((len = foo.length) === bar.length) {
        while (len-- && deepEqual(foo[len], bar[len]));
      }
      return len === -1;
    }

    if (ctor === Set) {
      if (foo.size !== bar.size) {
        return false;
      }
      for (len of foo) {
        tmp = len;
        if (tmp && typeof tmp === 'object') {
          tmp = find(bar, tmp);
          if (!tmp) return false;
        }
        if (!bar.has(tmp)) return false;
      }
      return true;
    }

    if (ctor === Map) {
      if (foo.size !== bar.size) {
        return false;
      }
      for (len of foo) {
        tmp = len[0];
        if (tmp && typeof tmp === 'object') {
          tmp = find(bar, tmp);
          if (!tmp) return false;
        }
        if (!deepEqual(len[1], bar.get(tmp))) {
          return false;
        }
      }
      return true;
    }

    if (ctor === ArrayBuffer) {
      foo = new Uint8Array(foo);
      bar = new Uint8Array(bar);
    } else if (ctor === DataView) {
      if ((len = foo.byteLength) === bar.byteLength) {
        while (len-- && foo.getInt8(len) === bar.getInt8(len));
      }
      return len === -1;
    }

    if (ArrayBuffer.isView(foo)) {
      if ((len = foo.byteLength) === bar.byteLength) {
        while (len-- && (foo as any)[len] === bar[len]);
      }
      return len === -1;
    }

    // react & dom
    if (hasElementType && foo instanceof Element) return false;

    if (!ctor || typeof foo === 'object') {
      len = 0;
      for (ctor in foo) {
        if ((ctor === '_owner' || ctor === '__v' || ctor === '__o') && foo.$$typeof) {
          // React-specific: avoid traversing React elements' _owner
          // Preact-specific: avoid traversing Preact elements' __v and __o
          //    __v = $_original / $_vnode
          //    __o = $_owner
          // These properties contain circular references and are not needed when
          // comparing the actual elements (and not their owners)
          // .$$typeof and ._store on just reasonable markers of elements

          continue;
        }

        if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false;
        if (!(ctor in bar) || !deepEqual(foo[ctor], bar[ctor])) return false;
      }
      return Object.keys(bar).length === len;
    }
  }

  return foo !== foo && bar !== bar;
}
