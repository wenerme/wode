// https://github.com/TehShrike/deepmerge/blob/master/index.js
import { isMergeableObject as defaultIsMergeableObject } from './isMergeableObject';

function emptyTarget(val: any) {
  return Array.isArray(val) ? [] : {};
}

function cloneUnlessOtherwiseSpecified(value: any, options: Options) {
  return options.clone !== false && options.isMergeableObject(value)
    ? merge(emptyTarget(value), value, options)
    : value;
}

function defaultArrayMerge(target: any, source: any, options: Options) {
  return target.concat(source).map(function (element: any) {
    return cloneUnlessOtherwiseSpecified(element, options);
  });
}

type Merger = (x: any, y: any, options: Options) => any;

function getMergeFunction(key: any, options: Options): Merger {
  if (!options.customMerge) {
    return merge;
  }
  var customMerge = options.customMerge(key);
  return typeof customMerge === 'function' ? customMerge : merge;
}

function getEnumerableOwnPropertySymbols(target: any): any {
  return Object.getOwnPropertySymbols
    ? Object.getOwnPropertySymbols(target).filter(function (symbol) {
        return Object.propertyIsEnumerable.call(target, symbol);
      })
    : [];
}

function getKeys(target: any) {
  return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
}

function propertyIsOnObject(object: any, property: any) {
  try {
    return property in object;
  } catch (_) {
    return false;
  }
}

// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target: any, key: string) {
  return (
    propertyIsOnObject(target, key) && // Properties are safe to merge if they don't exist in the target yet,
    !(
      Object.hasOwnProperty.call(target, key) && // unsafe if they exist up the prototype chain,
      Object.propertyIsEnumerable.call(target, key)
    )
  ); // and also unsafe if they're nonenumerable.
}

function mergeObject(target: any, source: any, options: Options) {
  const destination: Record<string, any> = {};
  if (options.isMergeableObject(target)) {
    getKeys(target).forEach((key) => {
      destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
    });
  }
  getKeys(source).forEach((key) => {
    if (propertyIsUnsafe(target, key)) {
      return;
    }

    if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
      destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
    } else {
      destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
    }
  });
  return destination;
}

export function merge<T1, T2>(x: Partial<T1>, y: Partial<T2>, options?: MergeOptions): T1 & T2;
export function merge<T>(x: Partial<T>, y: Partial<T>, options?: MergeOptions): T;

export function merge(target: any, source: any, opts?: any): any {
  const options = {
    arrayMerge: defaultArrayMerge,
    isMergeableObject: defaultIsMergeableObject,
    ...opts,
    // cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
    // implementations can use it. The caller may not replace it.
    cloneUnlessOtherwiseSpecified,
  } as Options & ArrayMergeOptions;

  let sourceIsArray = Array.isArray(source);
  let targetIsArray = Array.isArray(target);
  let sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

  if (!sourceAndTargetTypesMatch) {
    return cloneUnlessOtherwiseSpecified(source, options);
  } else if (sourceIsArray) {
    return options.arrayMerge(target, source, options);
  } else {
    return mergeObject(target, source, options);
  }
}

merge.all = function deepmergeAll(array: any[], options?: MergeOptions) {
  if (!Array.isArray(array)) {
    throw new Error('first argument should be an array');
  }

  return array.reduce(function (prev, next) {
    return merge(prev, next, options);
  }, {});
};

export interface MergeOptions {
  arrayMerge?(target: any[], source: any[], options?: ArrayMergeOptions): any[];

  clone?: boolean;
  customMerge?: (key: string, options?: MergeOptions) => ((x: any, y: any) => any) | undefined;

  isMergeableObject?(value: object): boolean;
}

interface Options {
  arrayMerge(target: any[], source: any[], options?: ArrayMergeOptions): any[];

  clone: boolean;
  customMerge: (key: string, options?: MergeOptions) => ((x: any, y: any) => any) | undefined;

  isMergeableObject(value: object): boolean;
}

export interface ArrayMergeOptions {
  isMergeableObject(value: object): boolean;

  cloneUnlessOtherwiseSpecified(value: object, options?: MergeOptions): object;
}
