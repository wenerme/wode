import { BencodeDecoder } from './BencodeDecoder';
import { BencodeEncoder } from './BencodeEncoder';

/**
 * Bencode Encoding
 */
export namespace Bencode {
  /**
   * byte length of encoded data
   */
  export const byteLength = (data: any) => new BencodeEncoder().byteLength(data);
  export const encode = (data: any, buffer?: ArrayBuffer, offset = 0): ArrayBuffer => {
    return new BencodeEncoder().encode(data, buffer, offset);
  };

  export const decode = (buffer: BufferSource, start?: number, end?: number) => {
    return new BencodeDecoder().decode(buffer, start, end);
  };
  /**
   * createDecoder for customize decoder processing
   */
  export const createDecoder = () => new BencodeDecoder();
  export const createEncoder = () => new BencodeEncoder();
}
