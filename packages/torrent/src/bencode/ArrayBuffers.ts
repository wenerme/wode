import { TextDecoder } from 'util';
import { classOf } from '@wener/utils';

export const ArrayBuffers = {
  isArrayBuffer: (v: any): v is ArrayBuffer => {
    return v instanceof ArrayBuffer;
  },
  stringify: (v: ArrayBuffer | DataView | ArrayBufferView | string) => {
    if (typeof v === 'string') {
      return v;
    }
    return new TextDecoder().decode(v as any);
  },
  from: (v: string | ArrayBufferViewLike): ArrayBuffer => {
    if (!v) {
      return new ArrayBuffer(0);
    }
    if (typeof v === 'string') {
      return new TextEncoder().encode(v as string).buffer;
    }
    if (v instanceof ArrayBuffer) {
      return v;
    }
    let type = classOf(v);
    // lost some info
    if ('buffer' in v && v.buffer instanceof ArrayBuffer) {
      if (v.byteOffset !== 0) {
        // return v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength)
        throw new Error('ArrayBuffers.from do not support view with offset');
      }
      return v.buffer;
    }

    throw new TypeError(`ArrayBuffers.from unsupported type ${type}`);
  },
  concat: (buffers: Array<ArrayBufferViewLike>, result?: ArrayBuffer, offset = 0) => {
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
export type ArrayBufferViewLike = ArrayBuffer | ArrayBufferView | TypedArray | DataView;
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
