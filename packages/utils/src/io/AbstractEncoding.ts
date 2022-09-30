/**
 * AbstractEncoding
 *
 * @see https://github.com/mafintosh/abstract-encoding
 */
export interface AbstractEncoding<T> {
  encode(data: T, buffer?: ArrayBuffer, offset?: number): any;

  decode(buffer: ArrayBuffer, start?: number, end?: number): T;
}
