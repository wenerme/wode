import { classOf } from '../langs/classOf';
import { getGlobalThis } from '../web/getGlobalThis';
import { decodeBase64ToUint8Array, encodeArrayBufferToBase64 } from './base64';
import { isBuffer } from './isBuffer';

/**
 * Various utils to work with {@link ArrayBuffer}
 *
 * @see https://github.com/tc39/proposal-resizablearraybuffer
 */
export namespace ArrayBuffers {
  /*
Uint8Array to/from base64 and hex
Stage 3
Uint8Array.fromBase64, Uint8Array.prototype.toBase64
Uint8Array.fromHex, Uint8Array.prototype.toHex
https://github.com/tc39/proposal-arraybuffer-base64
 */

  /*
In-Place Resizable and Growable ArrayBuffers
Stage 4
Chrome 111, Nodejs 20, Safari 16.4

SharedArrayBuffer & ArrayBuffer
constructor(byteLength, {maxByteLength})
prototype.resize(newByteLength)
prototype.slice(start, end)
prototype.{resizable,maxByteLength}
https://github.com/tc39/proposal-resizablearraybuffer
   */

  export type BinaryStringEncoding =
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

  let nativeBufferAllowed: boolean = true;
  let isBufferAvailable: undefined | boolean;

  /**
   * isNativeBufferAvailable check if the native {@link Buffer} is available
   */
  export function isNativeBufferAvailable(): boolean {
    // eslint-disable-next-line no-return-assign
    return (isBufferAvailable ??= !(getGlobalThis().Buffer as any)?.isPollyfill?.());
  }

  export function isNativeBufferAllowed(): boolean {
    return Boolean(nativeBufferAllowed && isBufferAvailable);
  }

  export function setNativeBufferAllowed(v: boolean): void {
    nativeBufferAllowed = v;
  }

  /**
   * isArrayBuffer check if the given value is an {@link ArrayBuffer}
   */
  export function isArrayBuffer(v: any): v is ArrayBuffer {
    return v instanceof ArrayBuffer;
  }

  /**
   * slice the given view with the given offset and length, will handle the {@link Buffer} as well
   *
   * @see {@link https://nodejs.org/api/buffer.html#bufslicestart-end Buffer.slice}
   */
  export function slice<T extends TypedArray>(o: T, start?: number, end?: number): T {
    // NodeJS Buffer slice is not the same as UInt8Array slice
    // https://nodejs.org/api/buffer.html#bufslicestart-end
    if (isBuffer(o)) {
      return Uint8Array.prototype.slice.call(o, start, end) as T;
    }
    return o.slice(start, end) as T;
  }

  /**
   * asView convert the given value to given {@link TypedArray} view
   *
   * TypedArray can be {@link Buffer}, will avoid copy
   */
  export function asView<C extends ArrayBufferViewConstructor<unknown>>(
    TypedArray: C,
    v: BufferSource,
    byteOffset?: number,
    byteLength?: number,
  ): InstanceType<C> {
    if (v instanceof TypedArray && (byteOffset ?? 0) === 0 && byteLength === undefined) {
      return v as InstanceType<C>;
    }
    if (ArrayBuffer.isView(v) || isBuffer(v)) {
      if (isNativeBufferAllowed() && (TypedArray as any) === Buffer) {
        // new Buffer() is deprecated
        return Buffer.from(v.buffer, byteOffset, byteLength) as InstanceType<C>;
      }
      return new TypedArray(v.buffer, v.byteOffset + (byteOffset ?? 0), byteLength ?? v.byteLength) as InstanceType<C>;
    }
    return new TypedArray(v, byteOffset, byteLength) as InstanceType<C>;
  }

  /**
   * toString convert the given {@link BufferSource} to string
   */
  export function toString(source: BufferSource | string, encoding: BinaryStringEncoding = 'utf8'): string {
    // 'ascii'  'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex'
    if (typeof source === 'string') {
      switch (encoding) {
        case 'base64':
          return btoa(source);
        case 'utf-8':
        case 'utf8':
          return source;
        default:
          throw new Error(`[ArrayBuffers.toString] Unsupported encoding for string: ${encoding}`);
      }
    }
    let u8 = asView(Uint8Array, source);
    if (isNativeBufferAllowed()) {
      return Buffer.from(u8).toString(encoding);
    }
    // reference
    // https://github.com/feross/buffer/blob/master/index.js
    switch (encoding) {
      case 'hex': {
        return [...u8].map((b) => hexLookupTable[b]).join('');
      }
      case 'base64': {
        return encodeArrayBufferToBase64(u8);
      }
      case 'utf8':
      // falls through
      case 'utf-8':
        return new TextDecoder().decode(source);
      case 'ascii': {
        return String.fromCharCode(...u8.map((v) => v & 0x7f));
      }
      case 'latin1':
      // falls through
      case 'binary': {
        return String.fromCharCode(...u8);
      }
      case 'ucs2':
      // falls through
      case 'ucs-2':
      // case 'utf-16le':
      // falls through
      case 'utf16le': {
        let res = '';
        // If length is odd, the last 8 bits must be ignored (same as node.js)
        for (let i = 0; i < u8.length - 1; i += 2) {
          res += String.fromCharCode(u8[i] + u8[i + 1] * 256);
        }
        return res;
      }
      default:
        throw new Error(`[ArrayBuffers.toString] Unknown encoding: ${encoding}`);
    }
  }

  function normalizeEncoding(encoding: string | undefined) {
    switch (encoding?.toLowerCase()) {
      case 'utf-8':
      case 'utf8':
        return 'utf8';
      case 'utf-16le':
      case 'ucs2':
      case 'ucs-2':
        return 'utf16le';
      case 'hex':
      case 'ascii':
      case 'latin1':
      case 'binary':
      case 'base64':
      case 'utf16le':
        return encoding;
      default:
        return undefined;
    }
  }

  /**
   * Returns true if encoding is the name of a supported character encoding, or false otherwise.
   */
  export function isEncoding(v?: string): v is BinaryStringEncoding {
    return normalizeEncoding(v) !== undefined;
  }

  export function toJSON<T = any>(v: BufferSource | string, reviver?: (this: any, key: string, value: any) => any): T {
    return JSON.parse(toString(v), reviver);
  }

  /**
   * from convert the given value to {@link ArrayBuffer} like
   */
  export function from(
    src: string | BufferSource | Array<number> | Iterable<number>,
    encoding?: BinaryStringEncoding,
  ): ArrayBuffer | TypedArray;
  /**
   * from convert the given value to {@link TypedArray}
   */
  export function from<C extends ArrayBufferViewConstructor<unknown>>(
    src: string | BufferSource | Array<number> | Iterable<number>,
    encoding: BinaryStringEncoding,
    TypedArray: C,
  ): InstanceType<C>;
  export function from(
    src: string | BufferSource | Array<number> | Iterable<number>,
    encoding: BinaryStringEncoding = 'utf8',
    view?: any,
  ): any {
    if (!src) {
      return new (view || ArrayBuffer)(0);
    }
    if (isBufferSource(src)) {
      return view ? asView(view, src) : src;
    }
    // Array<number> | Iterable<number>
    if ((typeof src !== 'string' && isIterable(src)) || Array.isArray(src)) {
      return (view || Uint8Array).from(src);
    }
    if (view) {
      return asView(view, from(src, encoding));
    }
    if (typeof src === 'string') {
      // is string
      if (isNativeBufferAllowed()) {
        return Buffer.from(src, encoding);
      }
      switch (encoding) {
        case 'utf-8':
        // falls through
        case 'utf8':
          return new TextEncoder().encode(src).buffer;
        case 'base64':
          // replaceAll need higher version of nodejs
          // return decodeBase64ToArrayBuffer(v.replace(/[^0-9a-zA-Z=+/_]/g, ''));
          return fromBase64(src);
        case 'hex':
          // return new Uint8Array(v.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))).buffer;
          return fromHex(src);
        default:
          throw new Error(`ArrayBuffers.from unsupported encoding: ${encoding}`);
      }
    }

    const type = classOf(src);
    throw new TypeError(`ArrayBuffers.from unsupported type ${type}`);
  }

  /**
   * concat the given {@link BufferSource} to a new {@link ArrayBuffer}
   */
  export function concat(buffers: Array<BufferSource>, result?: ArrayBuffer, offset = 0): ArrayBuffer {
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
  }

  export function fromBase64(v: string): Uint8Array {
    if ('fromBase64' in Uint8Array) {
      return Uint8Array.fromBase64(v);
    }
    if (isNativeBufferAllowed()) {
      return Buffer.from(v, 'base64');
    }
    return decodeBase64ToUint8Array(v.replace(/[^0-9a-zA-Z=+/_]/g, ''));
  }

  export function fromHex(v: string): Uint8Array {
    if ('fromHex' in Uint8Array) {
      return Uint8Array.fromHex(v);
    }
    if (isNativeBufferAllowed()) {
      return Buffer.from(v, 'hex');
    }
    return new Uint8Array(v.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  }

  /**
   * toBase64 convert the given {@link BufferSource} to base64 string
   * @param source if string, will be encoded as utf8
   */
  export function toBase64(source: BufferSource | string): string {
    if (typeof source === 'string') {
      source = new TextEncoder().encode(source);
    }
    if ('toBase64' in Uint8Array.prototype) {
      return toUint8Array(source).toBase64();
    }
    if (isNativeBufferAllowed()) {
      return Buffer.from(asView(Uint8Array, source)).toString('base64');
    }
    return encodeArrayBufferToBase64(toArrayBuffer(source));
  }

  export function toHex(v: BufferSource): string {
    if ('toHex' in Uint8Array.prototype) {
      return toUint8Array(v).toHex();
    }
    if (isNativeBufferAllowed()) {
      return Buffer.from(asView(Uint8Array, v)).toString('hex');
    }
    return toString(v, 'hex');
  }

  export function resize(v: ArrayBuffer, newByteLength?: number, maxByteLength?: number): ArrayBuffer {
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
  }

  export function toArrayBuffer(v: BufferSource): ArrayBuffer {
    if (v instanceof ArrayBuffer) {
      return v;
    }
    if (ArrayBuffer.isView(v)) {
      if (v.byteOffset > 0) {
        throw new Error('ArrayBuffers.toArrayBuffer do not support view with offset');
      }
      return v.buffer;
    }
    throw new Error(`ArrayBuffers.toArrayBuffer unsupported type ${classOf(v)}`);
  }

  export function toUint8Array(v: BufferSource): Uint8Array {
    return asView(Uint8Array, v);
  }

  export function alloc(size: number, fill?: string | number, encoding?: BinaryStringEncoding): ArrayBuffer {
    if (fill !== undefined) {
      if (typeof fill === 'number') {
        return new Uint8Array(size).fill(fill);
      }
      // as cast
      // https://stackoverflow.com/questions/73994091
      return asView(Uint8Array, from(fill, encoding)).slice(0, size);
    }
    return new ArrayBuffer(size);
  }
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

function isIterable(obj: any): obj is Iterable<any> {
  return typeof obj?.[Symbol.iterator] === 'function';
}

function isBufferSource(v: any): v is BufferSource {
  return ArrayBuffer.isView(v) || v instanceof ArrayBuffer;
}
