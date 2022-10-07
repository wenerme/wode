/**
 * check {@link obj} is Buffer
 *
 * @see {@link https://github.com/feross/is-buffer feross/is-buffer}
 */
export function isBuffer(obj: any): obj is Buffer {
  return obj?.constructor?.isBuffer(obj);
}
