import { classOf } from '../langs/classOf';
import { isBuffer } from './isBuffer';

/**
 * Various utils to work with {@link ArrayBuffer}
 */
export type ArrayBuffers = {
  /**
   * isArrayBuffer check if the given value is an {@link ArrayBuffer}
   */
  isArrayBuffer(v: any): v is ArrayBuffer;

  /**
   * slice the given view with the given offset and length, will handle the {@link Buffer} as well
   *
   * @see {@link https://nodejs.org/api/buffer.html#bufslicestart-end Buffer.slice}
   */
  slice<T extends ArrayBufferView>(o: T, start?: number, end?: number): T;

  /**
   * asView convert the given value to given {@link TypedArray} view
   *
   * TypedArray can be {@link Buffer}, will avoid copy
   */
  asView<V, C extends ArrayBufferViewConstructor<V>>(
    TypedArray: C,
    v: BufferSource,
    byteOffset?: number,
    byteLength?: number,
  ): V;

  /**
   * toString convert the given {@link BufferSource} to string
   */
  toString(v: BufferSource | string, encoding?: ToStringEncoding): string;
  /**
   * Returns true if encoding is the name of a supported character encoding, or false otherwise.
   */
  isEncoding(v?: string): v is ToStringEncoding;

  toJSON<T = any>(v: BufferSource | string, reviver?: (this: any, key: string, value: any) => any): T;

  /**
   * from convert the given value to {@link ArrayBuffer}
   */
  from(v: string | BufferSource, encoding?: ToStringEncoding): ArrayBuffer;

  /**
   * concat the given {@link BufferSource} to a new {@link ArrayBuffer}
   */
  concat(buffers: Array<BufferSource>, result?: ArrayBuffer, offset?: number): ArrayBuffer;
};

type ToStringEncoding =
  | 'ascii'
  | 'utf16le'
  // | 'utf-16le'
  | 'ucs2'
  | 'ucs-2'
  | 'base64'
  | 'base64url'
  | 'latin1'
  | 'binary'
  | 'utf8'
  | 'utf-8'
  | 'hex';

export const ArrayBuffers = {
  _allowedBuffer: true,
  isArrayBuffer: (v: any): v is ArrayBuffer => {
    return v instanceof ArrayBuffer;
  },
  slice: (o: TypedArray, start?: number, end?: number) => {
    // NodeJS Buffer slice is not the same as UInt8Array slice
    // https://nodejs.org/api/buffer.html#bufslicestart-end
    if (isBuffer(o)) {
      return Uint8Array.prototype.slice.call(o, start, end);
    }
    return o.slice(start, end);
  },
  asView: <V, C extends ArrayBufferViewConstructor<V>>(
    TypedArray: C,
    v: BufferSource,
    byteOffset: number = 0,
    byteLength?: number,
  ): V => {
    if (v instanceof TypedArray && (byteOffset ?? 0) === 0 && byteLength === undefined) {
      return v;
    }
    if (ArrayBuffer.isView(v) || isBuffer(v)) {
      return new TypedArray(v.buffer, v.byteOffset + byteOffset, byteLength ?? v.byteLength);
    }
    return new TypedArray(v, byteOffset, byteLength);
  },
  toString: (buf: BufferSource | string, encoding: ToStringEncoding = 'utf8') => {
    // 'ascii'  'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex'
    if (typeof buf === 'string') {
      return buf;
    }
    if (typeof Buffer !== undefined && ArrayBuffers._allowedBuffer) {
      return Buffer.from(ArrayBuffers.asView(Uint8Array, buf)).toString(encoding);
    }
    // reference
    // https://github.com/feross/buffer/blob/master/index.js
    switch (encoding) {
      case 'hex': {
        let view: Uint8Array = ArrayBuffers.asView(Uint8Array, buf);
        return [...view].map((b) => hexLookupTable[b]).join('');
      }
      case 'base64': {
        let view: Uint8Array = ArrayBuffers.asView(Uint8Array, buf);
        return btoa(String.fromCharCode(...view));
      }
      case 'utf8':
      case 'utf-8':
        return new TextDecoder().decode(buf as any);
      case 'ascii': {
        let view: Uint8Array = ArrayBuffers.asView(Uint8Array, buf);
        return String.fromCharCode(...view.map((v) => v & 0x7f));
      }
      case 'latin1':
      case 'binary': {
        let view: Uint8Array = ArrayBuffers.asView(Uint8Array, buf);
        return String.fromCharCode(...view);
      }
      case 'ucs2':
      case 'ucs-2':
      // case 'utf-16le':
      case 'utf16le': {
        let view: Uint8Array = ArrayBuffers.asView(Uint8Array, buf);
        let res = '';
        // If length is odd, the last 8 bits must be ignored (same as node.js)
        for (let i = 0; i < view.length - 1; i += 2) {
          res += String.fromCharCode(view[i] + view[i + 1] * 256);
        }
        return res;
      }
      default:
        throw new Error(`[ArrayBuffers.toString] Unknown encoding: ${encoding}`);
    }
  },
  toJSON: (v: BufferSource | string, reviver?: (this: any, key: string, value: any) => any) => {
    return JSON.parse(ArrayBuffers.toString(v), reviver);
  },
  alloc: (size: number, fill?: string | number, encoding?: ToStringEncoding) => {
    if (fill !== undefined) {
      if (typeof fill === 'number') {
        return new Uint8Array(size).fill(fill);
      }
      return (ArrayBuffers.asView(Uint8Array, ArrayBuffers.from(fill, encoding)) as Uint8Array).slice(0, size);
    }
    return new ArrayBuffer(size);
  },
  from: (v: string | BufferSource | Array<number>, encoding: ToStringEncoding = 'utf8'): BufferSource => {
    if (!v) {
      return new ArrayBuffer(0);
    }
    if (typeof v === 'string') {
      if (typeof Buffer !== undefined && ArrayBuffers._allowedBuffer) {
        return Buffer.from(v, encoding);
      }

      switch (encoding) {
        case 'utf-8':
        case 'utf8':
          return new TextEncoder().encode(v as string).buffer;
        case 'base64':
          return Uint8Array.from(atob(v.replaceAll(/[^0-9a-zA-Z=+/_ \r\n]/g, '')), (c) => c.charCodeAt(0));
        default:
          throw new Error(`[ArrayBuffers.from] Unknown encoding: ${encoding}`);
      }
    }
    if (v instanceof ArrayBuffer) {
      return v;
    }
    // lost length
    if (ArrayBuffer.isView(v) || isBuffer(v)) {
      if (v.byteOffset !== 0) {
        // return v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength)
        throw new Error('ArrayBuffers.from do not support view with offset');
      }
      return v.buffer;
    }
    if (Array.isArray(v)) {
      return new Uint8Array(v);
    }
    let type = classOf(v);
    throw new TypeError(`ArrayBuffers.from unsupported type ${type}`);
  },
  isEncoding: (encoding?: string) => {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'latin1':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
        // case 'utf-16le':
        return true;
      default:
        return false;
    }
  },
  concat: (buffers: Array<BufferSource>, result?: ArrayBuffer, offset = 0) => {
    // https://stackoverflow.com/questions/10786128/appending-arraybuffers

    const length = buffers.reduce((a, b) => a + b.byteLength, 0);
    const r = result ? new Uint8Array(result) : new Uint8Array(length);
    for (const buffer of buffers) {
      if (!buffer || !buffer.byteLength) continue;
      let n: Uint8Array;
      if (buffer instanceof ArrayBuffer) {
        n = new Uint8Array(buffer);
      } else if (ArrayBuffer.isView(buffer)) {
        n = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      } else {
        throw new Error(`ArrayBuffers.concat unsupported type ${classOf(buffer)}`);
      }
      r.set(n, offset);
      offset += buffer.byteLength;
    }
    return r.buffer;
  },
};

export type TypedArray =
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | BigUint64Array
  | BigInt64Array
  | Float32Array
  | Float64Array;

type ArrayBufferViewConstructor<T> = new (buffer: ArrayBufferLike, byteOffset?: number, byteLength?: number) => T;

const hexLookupTable = (function () {
  const alphabet = '0123456789abcdef';
  const table = new Array(256);
  for (let i = 0; i < 16; ++i) {
    const i16 = i * 16;
    for (let j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j];
    }
  }
  return table;
})();
