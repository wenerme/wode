import { classOf } from '../langs/classOf';

// see: https://github.com/mesqueeb/is-what/blob/88d6e4ca92fb2baab6003c54e02eedf4e729e5ab/src/index.ts

export function isPlainObject(value: any): value is Record<string, any> {
  if (classOf(value) !== 'Object') {
    return false;
  }
  return value.constructor === Object && Object.getPrototypeOf(value) === Object.prototype;
}
