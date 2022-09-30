/**
 * check {@code obj} is Buffer
 *
 * {@link https://github.com/feross/is-buffer feross/is-buffer}
 */
export function isBuffer(obj: any): obj is Buffer {
  return (
    obj != null &&
    obj.constructor != null &&
    typeof obj.constructor.isBuffer === 'function' &&
    obj.constructor.isBuffer(obj)
  );
}
