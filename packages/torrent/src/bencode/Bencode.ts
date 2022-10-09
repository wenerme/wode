import type { AbstractEncoding } from '@wener/utils';
import { BencodeDecoder } from './BencodeDecoder';
import { BencodeEncoder } from './BencodeEncoder';

/**
 * Bencode Encoding
 */
export interface Bencode extends AbstractEncoding<any> {
  /**
   * byte length of encoded data
   */
  byteLength(data: any): number;

  /**
   * createDecoder for customize decoder processing
   */
  createDecoder(): typeof BencodeDecoder;

  createEncoder(): typeof BencodeEncoder;
}

export class Bencode {
  static byteLength = (data: any) => new BencodeEncoder().byteLength(data);
  static encode = (data: any, buffer?: ArrayBuffer, offset = 0): ArrayBuffer => {
    return new BencodeEncoder().encode(data, buffer, offset);
  };

  static decode = (buffer: BufferSource, start?: number, end?: number) => {
    return new BencodeDecoder().decode(buffer, start, end);
  };

  static createDecoder = () => new BencodeDecoder();
  static createEncoder = () => new BencodeEncoder();
}
