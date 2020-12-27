// https://github.com/feross/is-buffer/blob/master/index.js
export function isBuffer(obj: any): obj is Buffer {
  return (
    obj != null &&
    obj.constructor != null &&
    typeof obj.constructor.isBuffer === 'function' &&
    obj.constructor.isBuffer(obj)
  );
}
