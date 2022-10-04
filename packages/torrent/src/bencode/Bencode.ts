import { AbstractEncoding } from '@wener/utils';
import { BencodeDecoder } from './BencodeDecoder';
import { BencodeEncoder } from './BencodeEncoder';

/**
 * Bencode Encoding
 */
export interface Bencode extends AbstractEncoding<any> {
  byteLength(data: any): number;

  /**
   * createDecoder for customize decoder processing
   */
  createDecoder(): typeof BencodeDecoder;

  createEncoder(): typeof BencodeEncoder;
}

export const Bencode = {
  byteLength: (data: any) => new BencodeEncoder().byteLength(data),
  encode: (data: any, buffer?: ArrayBuffer, offset = 0): ArrayBuffer => {
    return new BencodeEncoder().encode(data, buffer, offset);
  },
  decode: (buffer: BufferSource, start?: number, end?: number) => {
    return new BencodeDecoder().decode(buffer, start, end);
  },
  createDecoder: () => new BencodeDecoder(),
  createEncoder: () => new BencodeEncoder(),
};

export default Bencode;
