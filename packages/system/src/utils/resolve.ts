// https://github.com/lukeed/resolve.exports/blob/master/src/index.js
/* eslint no-cond-assign:0 no-unreachable-loop:0 */

function loop(exports: any, keys: Set<string>): string | undefined {
  if (typeof exports === 'string') {
    return exports;
  }

  if (exports) {
    let idx, tmp;
    if (Array.isArray(exports)) {
      for (idx = 0; idx < exports.length; idx++) {
        if ((tmp = loop(exports[idx], keys))) return tmp;
      }
    } else {
      for (idx in exports) {
        if (keys.has(idx)) {
          return loop(exports[idx], keys);
        }
      }
    }
  }
  return undefined;
}

function bail(name: string, entry: string, condition?: number): undefined {
  throw new Error(
    condition
      ? `No known conditions for "${entry}" entry in "${name}" package`
      : `Missing "${entry}" export in "${name}" package`,
  );
}

function toName(name: string, entry: string) {
  return entry === name ? '.' : entry[0] === '.' ? entry : entry.replace(new RegExp('^' + name + '/'), './');
}

export interface ResolveOptions {
  browser?: boolean;
  // only include default & conditions, otherwise add import, node
  unsafe?: boolean;
  require?: boolean;
  conditions?: string[];
}

/**
 * resolve based on exports
 */
export function resolve(pkg: any, entry = '.', options: ResolveOptions = {}): string | undefined {
  const { name, exports } = pkg;

  if (exports) {
    const { browser, require, unsafe, conditions = [] } = options;

    let target = toName(name, entry);
    if (target[0] !== '.') target = './' + target;

    if (typeof exports === 'string') {
      return target === '.' ? exports : bail(name, target);
    }

    const allows = new Set(['default', ...conditions]);
    unsafe || allows.add(require ? 'require' : 'import');
    unsafe || allows.add(browser ? 'browser' : 'node');

    let key;
    let tmp;
    let isSingle = false;

    for (key in exports) {
      isSingle = key[0] !== '.';
      break;
    }

    if (isSingle) {
      return target === '.' ? loop(exports, allows) || bail(name, target, 1) : bail(name, target);
    }

    if ((tmp = exports[target])) {
      return loop(tmp, allows) || bail(name, target, 1);
    }

    for (key in exports) {
      tmp = key[key.length - 1];
      if (tmp === '/' && target.startsWith(key)) {
        return (tmp = loop(exports[key], allows)) ? tmp + target.substring(key.length) : bail(name, target, 1);
      }
      if (tmp === '*' && target.startsWith(key.slice(0, -1))) {
        // do not trigger if no *content* to inject
        if (target.substring(key.length - 1).length > 0) {
          return (tmp = loop(exports[key], allows))
            ? tmp.replace('*', target.substring(key.length - 1))
            : bail(name, target, 1);
        }
      }
    }

    return bail(name, target);
  }
  return undefined;
}

/**
 * resolve main, module, browser
 */
export function legacy(pkg: any, options: { browser?: boolean | string; fields?: string[] } = {}) {
  let i = 0;
  let value;
  let browser = options.browser;
  const fields = options.fields ?? ['module', 'main'];

  if (browser && !fields.includes('browser')) {
    fields.unshift('browser');
  }

  for (; i < fields.length; i++) {
    if ((value = pkg[fields[i]])) {
      if (typeof value === 'string') {
        //
      } else if (typeof value === 'object' && fields[i] === 'browser') {
        if (typeof browser === 'string') {
          value = value[(browser = toName(pkg.name, browser))];
          if (value == null) return browser;
        }
      } else {
        continue;
      }

      return typeof value === 'string' ? './' + value.replace(/^\.?\//, '') : value;
    }
  }
}
