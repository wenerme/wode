import { isBuffer } from './isBuffer';
import { classOf } from '../langs/classOf';

/**
 * Various utils to work with {@link ArrayBuffer}
 */
interface ArrayBuffers {
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
   */
  asView<V, C extends ArrayBufferViewConstructor<V>>(TypedArray: C, v: BufferSource, byteOffset?: number, byteLength?: number): V;

  /**
   * toString convert the given {@link BufferSource} to string
   */
  toString(v: BufferSource | string): string;

  toJSON<T>(v: BufferSource | string, reviver?: (this: any, key: string, value: any) => any): T;


  /**
   * from convert the given value to {@link ArrayBuffer}
   */
  from(v: string | BufferSource): ArrayBuffer;

  /**
   * concat the given {@link BufferSource} to a new {@link ArrayBuffer}
   */
  concat(buffers: Array<BufferSource>, result?: ArrayBuffer, offset?: number): ArrayBuffer;
}

export const ArrayBuffers = {
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
  asView: <V, C extends ArrayBufferViewConstructor<V>>(TypedArray: C, v: BufferSource, byteOffset: number = 0, byteLength?: number): V => {
    if (v instanceof TypedArray && (byteOffset ?? 0) === 0 && byteLength === undefined) {
      return v;
    }
    if (ArrayBuffer.isView(v) || isBuffer(v)) {
      return new TypedArray(v.buffer, v.byteOffset + byteOffset, byteLength ?? v.byteLength);
    }
    return new TypedArray(v, byteOffset, byteLength);
  },
  toString: (v: BufferSource | string) => {
    if (typeof v === 'string') {
      return v;
    }
    return new TextDecoder().decode(v as any);
  },
  toJSON: (v: BufferSource | string, reviver?: (this: any, key: string, value: any) => any) => {
    return JSON.parse(ArrayBuffers.toString(v), reviver);
  },
  from: (v: string | BufferSource): ArrayBuffer => {
    if (!v) {
      return new ArrayBuffer(0);
    }
    if (typeof v === 'string') {
      return new TextEncoder().encode(v as string).buffer;
    }
    if (v instanceof ArrayBuffer) {
      return v;
    }
    // lost some info
    if (ArrayBuffer.isView(v) || isBuffer(v)) {
      if (v.byteOffset !== 0) {
        // return v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength)
        throw new Error('ArrayBuffers.from do not support view with offset');
      }
      return v.buffer;
    }

    let type = classOf(v);
    throw new TypeError(`ArrayBuffers.from unsupported type ${type}`);
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
