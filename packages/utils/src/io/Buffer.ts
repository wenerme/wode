import { ArrayBuffers } from './ArrayBuffers';
import { isBuffer } from './isBuffer';

/**
 * Buffer is a polyfill version of NodeJS Buffer
 */
export class Buffer extends Uint8Array {
  // constructor(buffer: ArrayBufferLike, byteOffset?: number, length?: number) {
  //   super(buffer, byteOffset, length);
  // }

  static get isPolyfill() {
    return true;
  }

  static isBuffer(v: any): v is Buffer {
    return v instanceof Buffer || isBuffer(v);
  }

  static from(array: string | BufferSource | ArrayLike<number> | Iterable<number>, arg2?: any): Buffer {
    // todo mapfn
    return new Buffer(ArrayBuffers.from(array, arg2) as ArrayBuffer);
  }

  static isEncoding = ArrayBuffers.isEncoding;

  toString(encoding?: string): string {
    return ArrayBuffers.toString(this, encoding as any);
  }
}
