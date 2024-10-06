/**
 * AbstractEncoding contract
 *
 * @see https://github.com/mafintosh/abstract-encoding
 */
export interface AbstractEncoding<T> {
  /**
   * encode a value to a buffer
   */
  encode(data: T, buffer?: ArrayBuffer, offset?: number): BufferSource;

  /**
   * decode data from buffer
   */
  decode(buffer: BufferSource, start?: number, end?: number): T;

  /**
   * byteLength of data
   */
  byteLength?: (data: T) => number;
}
