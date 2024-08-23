import { classOf } from '../langs/classOf';
import { getGlobalThis } from '../runtime/getGlobalThis';
import { decodeBase64ToArrayBuffer, encodeArrayBufferToBase64 } from './base64';
import { isBuffer } from './isBuffer';

/**
 * Various utils to work with {@link ArrayBuffer}
 *
 * @see https://github.com/tc39/proposal-arraybuffer-base64
 * @see https://github.com/tc39/proposal-resizablearraybuffer
 */
export interface ArrayBuffers {
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
  asView<C extends ArrayBufferViewConstructor<unknown>>(
    TypedArray: C,
    v: BufferSource,
    byteOffset?: number,
    byteLength?: number,
  ): InstanceType<C>;

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

  from<C extends ArrayBufferViewConstructor<unknown>>(
    v: string | BufferSource,
    encoding: ToStringEncoding,
    TypedArray: C,
  ): C;

  /**
   * concat the given {@link BufferSource} to a new {@link ArrayBuffer}
   */
  concat(buffers: Array<BufferSource>, result?: ArrayBuffer, offset?: number): ArrayBuffer;

  fromBase64(v: string): Uint8Array;

  fromHex(v: string): Uint8Array;

  toBase64(v: BufferSource): string;

  toHex(v: BufferSource): string;

  resize(v: ArrayBuffer, newByteLength: number): ArrayBuffer;

  // truncate(v: ArrayBufferLike, len?: number): ArrayBufferLike;
}

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

export class ArrayBuffers {
  static #nativeBufferAllowed: boolean = true;
  static #isBufferAvailable: undefined | boolean;

  static isNativeBufferAvailable() {
    // eslint-disable-next-line no-return-assign
    return (this.#isBufferAvailable ??= !(getGlobalThis().Buffer as any)?.isPollyfill?.());
  }

  static isNativeBufferAllowed() {
    return this.#nativeBufferAllowed && this.#isBufferAvailable;
  }

  static setNativeBufferAllowed(v: boolean) {
    this.#nativeBufferAllowed = v;
  }

  static isArrayBuffer = (v: any): v is ArrayBuffer => {
    return v instanceof ArrayBuffer;
  };

  static toArrayBuffer(v: BufferSource): ArrayBuffer {
    return v instanceof ArrayBuffer ? v : (v.buffer as ArrayBuffer);
  }

  static toUint8Array(v: BufferSource) {
    return ArrayBuffers.asView(Uint8Array, v);
  }

  static toBase64 = (v: BufferSource) => {
    if ('toBase64' in Uint8Array.prototype) {
      return this.toUint8Array(v).toBase64();
    }

    if (ArrayBuffers.isNativeBufferAllowed()) {
      return Buffer.from(ArrayBuffers.asView(Uint8Array, v)).toString('base64');
    }

    return encodeArrayBufferToBase64(this.toArrayBuffer(v));
  };

  static toHex = (v: BufferSource) => {
    if ('toHex' in Uint8Array.prototype) {
      return this.toUint8Array(v).toHex();
    }
    if (ArrayBuffers.isNativeBufferAllowed()) {
      return Buffer.from(ArrayBuffers.asView(Uint8Array, v)).toString('hex');
    }
    return ArrayBuffers.toString(v, 'hex');
  };

  static fromBase64 = (v: string) => {
    if ('fromBase64' in Uint8Array) {
      return Uint8Array.fromBase64(v);
    }
    if (ArrayBuffers.isNativeBufferAllowed()) {
      return Buffer.from(v, 'base64');
    }
    return this.toUint8Array(decodeBase64ToArrayBuffer(v));
  };

  static fromHex = (v: string) => {
    if ('fromHex' in Uint8Array) {
      return Uint8Array.fromHex(v);
    }
    return this.toUint8Array(ArrayBuffers.from(v, 'hex'));
  };

  static resize = (v: ArrayBuffer, newByteLength?: number, maxByteLength?: number): ArrayBuffer => {
    if (newByteLength === undefined || newByteLength === null) {
      return v;
    }

    // Chrome 111, Nodejs 20
    if ('resize' in v && typeof v.resize === 'function') {
      if ('resizable' in v && v.resizable) {
        if ('maxByteLength' in v && typeof v.maxByteLength === 'number' && v.maxByteLength >= newByteLength) {
          v.resize(newByteLength);
          return v as ArrayBuffer;
        }
      }
    }

    const old = v;
    const newBuf = new ArrayBuffer(newByteLength, { maxByteLength: maxByteLength });
    const oldView = new Uint8Array(old);
    const newView = new Uint8Array(newBuf);
    newView.set(oldView);
    return newBuf;
  };

  static slice = (o: TypedArray, start?: number, end?: number) => {
    // NodeJS Buffer slice is not the same as UInt8Array slice
    // https://nodejs.org/api/buffer.html#bufslicestart-end
    if (isBuffer(o)) {
      return Uint8Array.prototype.slice.call(o, start, end);
    }
    return o.slice(start, end);
  };

  static asView = <C extends ArrayBufferViewConstructor<unknown>, I extends InstanceType<C>>(
    TypedArray: C,
    v: BufferSource,
    byteOffset?: number,
    byteLength?: number,
  ): I => {
    if (v instanceof TypedArray && (byteOffset ?? 0) === 0 && byteLength === undefined) {
      return v as I;
    }
    if (ArrayBuffer.isView(v) || isBuffer(v)) {
      if (ArrayBuffers.isNativeBufferAllowed() && (TypedArray as any) === Buffer) {
        // new Buffer() is deprecated
        return Buffer.from(v.buffer, byteOffset, byteLength) as I;
      }
      return new TypedArray(v.buffer, v.byteOffset + (byteOffset ?? 0), byteLength ?? v.byteLength) as I;
    }
    return new TypedArray(v, byteOffset, byteLength) as I;
  };

  static toString = (buf: BufferSource | string, encoding: ToStringEncoding = 'utf8') => {
    // 'ascii'  'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex'
    if (typeof buf === 'string') {
      switch (encoding) {
        case 'base64':
          return btoa(buf);
        case 'utf-8':
        case 'utf8':
          return buf;
        default:
          throw new Error(`[ArrayBuffers.toString] Unsupported encoding for string: ${encoding}`);
      }
    }
    if (ArrayBuffers.isNativeBufferAllowed()) {
      return Buffer.from(ArrayBuffers.asView(Uint8Array, buf)).toString(encoding);
    }
    // reference
    // https://github.com/feross/buffer/blob/master/index.js
    switch (encoding) {
      case 'hex': {
        const view: Uint8Array = ArrayBuffers.asView(Uint8Array, buf);
        return [...view].map((b) => hexLookupTable[b]).join('');
      }
      case 'base64': {
        return encodeArrayBufferToBase64(ArrayBuffers.asView(Uint8Array, buf));
      }
      case 'utf8':
      // falls through
      case 'utf-8':
        return new TextDecoder().decode(buf as any);
      case 'ascii': {
        const view: Uint8Array = ArrayBuffers.asView(Uint8Array, buf);
        return String.fromCharCode(...view.map((v) => v & 0x7f));
      }
      case 'latin1':
      // falls through
      case 'binary': {
        const view: Uint8Array = ArrayBuffers.asView(Uint8Array, buf);
        return String.fromCharCode(...view);
      }
      case 'ucs2':
      // falls through
      case 'ucs-2':
      // case 'utf-16le':
      // falls through
      case 'utf16le': {
        const view: Uint8Array = ArrayBuffers.asView(Uint8Array, buf);
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
  };

  static toJSON = (v: BufferSource | string, reviver?: (this: any, key: string, value: any) => any) => {
    return JSON.parse(ArrayBuffers.toString(v), reviver);
  };

  static alloc = (size: number, fill?: string | number, encoding?: ToStringEncoding) => {
    if (fill !== undefined) {
      if (typeof fill === 'number') {
        return new Uint8Array(size).fill(fill);
      }
      // as cast
      // https://stackoverflow.com/questions/73994091
      return ArrayBuffers.asView(Uint8Array, ArrayBuffers.from(fill, encoding)).slice(0, size);
    }
    return new ArrayBuffer(size);
  };

  static from = (
    v: string | BufferSource | ArrayLike<number> | Iterable<number>,
    encoding: ToStringEncoding = 'utf8',
    view?: any,
  ): any => {
    if (view) {
      return this.asView(view, this.from(v, encoding));
    }
    if (!v) {
      return new ArrayBuffer(0);
    }
    if (typeof v === 'string') {
      if (ArrayBuffers.isNativeBufferAllowed()) {
        return Buffer.from(v, encoding);
      }

      switch (encoding) {
        case 'utf-8':
        // falls through
        case 'utf8':
          return new TextEncoder().encode(v).buffer;
        case 'base64':
          // replaceAll need higher version of nodejs
          return decodeBase64ToArrayBuffer(v.replace(/[^0-9a-zA-Z=+/_]/g, ''));
        case 'hex':
          return new Uint8Array(v.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))).buffer;
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
    const type = classOf(v);
    throw new TypeError(`ArrayBuffers.from unsupported type ${type}`);
  };

  static isEncoding = (encoding?: string) => {
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
  };

  // static truncate = (a: ArrayBufferLike, len?: number) => {
  //   if (len === 0) {
  //     return new ArrayBuffer(0);
  //   }
  //   if (!len) {
  //     return a;
  //   }
  //   if (a.byteLength > len) {
  //     return a.slice(0, len);
  //   } else if (a.byteLength < len) {
  //     let b = new Uint8Array(len);
  //     b.set(new Uint8Array(a));
  //     return b;
  //   }
  //   return a;
  // };

  static concat = (buffers: Array<BufferSource>, result?: ArrayBuffer, offset = 0): ArrayBuffer => {
    // https://stackoverflow.com/questions/10786128/appending-arraybuffers

    const length = buffers.reduce((a, b) => a + b.byteLength, 0);
    const r = result ? new Uint8Array(result) : new Uint8Array(length);
    for (const buffer of buffers) {
      if (!buffer?.byteLength) continue;
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
  };
}

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

declare global {
  interface ArrayBuffer {
    resize?: (newByteLength: number) => void;
    resizable?: boolean;
  }

  interface ArrayBufferConstructor {
    new (byteLength: number, opts?: { maxByteLength?: number }): ArrayBuffer;
  }

  interface SharedArrayBuffer {
    resize?: (newByteLength: number) => void;
    resizable?: boolean;
  }

  interface Uint8Array {
    toBase64(): string;

    toHex(): string;
  }

  interface Uint8ArrayConstructor {
    fromBase64(v: string): Uint8Array;

    fromHex(v: string): Uint8Array;
  }
}
