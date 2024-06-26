import { ArrayBuffers } from './ArrayBuffers';

type AnyBuffer = BufferSource | ArrayBufferLike;

function asBuffer(o: AnyBuffer) {
  if (o instanceof ArrayBuffer) {
    return o;
  }
  if (ArrayBuffer.isView(o)) {
    // 保留 offset&length
    if (o.byteLength !== o.buffer.byteLength) {
      // ArrayBuffer 没有 subarray
      // if ('subarray' in o.buffer) {
      //   return (o.buffer as any).subarray(o.byteOffset, o.byteOffset + o.byteLength);
      // }
      return o.buffer.slice(o.byteOffset, o.byteOffset + o.byteLength);
    }
    return o.buffer;
  }
  return o;
}

// function asView(o: AnyBuffer) {
//   if (o instanceof DataView) {
//     return o;
//   }
//   if (ArrayBuffer.isView(o)) {
//     // 不 clone 也能保留 offset&length
//     return new DataView(o.buffer, o.byteOffset, o.byteLength);
//   }
//   return new DataView(o);
// }

/**
 * @see {@link https://www.egret.uk/docs/egretengine/engine/egret.ByteArray egret.ByteArray}
 * @see {@link https://github.com/protobufjs/bytebuffer.js protobufjs/bytebuffer.js}
 * @see {@link https://netty.io/4.1/api/io/netty/buffer/ByteBuf.html ByteBuf}
 */
export class ByteBuffer {
  position = 0;

  #buffer: ArrayBufferLike;
  #view: DataView;

  constructor(buffer: AnyBuffer = new ArrayBuffer(0, { maxByteLength: 1024 })) {
    this.#buffer = asBuffer(buffer);
    // NOTE prefer view over buffer, avoid the slice overhead ?
    this.#view = new DataView(this.#buffer);
  }

  get view() {
    return this.#view;
  }

  get buffer(): ArrayBufferLike {
    return this.#buffer;
  }

  set buffer(buffer: AnyBuffer) {
    this.#buffer = asBuffer(buffer);
    this.#view = new DataView(this.#buffer);
  }

  get length() {
    return this.view.byteLength;
  }

  set length(length: number) {
    this.resize(length);
  }

  private willWrite(length: number) {
    if (this.remaining() < length) {
      this.resize(this.position + length);
    }
  }

  resize(newLength: number) {
    this.buffer = ArrayBuffers.resize(this.buffer, newLength, Math.ceil(newLength * 1.2));
  }

  writeByte(value: number) {
    this.willWrite(1);
    this.view.setUint8(this.position++, value);
  }

  writeBytes(bytes: ArrayBufferLike, len: number = bytes.byteLength) {
    this.willWrite(len);
    if (len !== bytes.byteLength) bytes = bytes.slice(0, len);
    new Uint8Array(this.buffer).set(new Uint8Array(bytes), this.position);
    this.position += len;
  }

  writeInt8(value: number) {
    this.willWrite(1);
    this.view.setInt8(this.position, value);
    this.position += 1;
  }

  writeUint8(value: number) {
    this.willWrite(1);
    this.view.setUint8(this.position, value);
    this.position += 1;
  }

  writeInt16(value: number) {
    this.willWrite(2);
    this.view.setInt16(this.position, value);
    this.position += 2;
  }

  writeUint16(value: number) {
    this.willWrite(2);
    this.view.setUint16(this.position, value);
    this.position += 2;
  }

  writeInt32(value: number) {
    this.willWrite(4);
    this.view.setInt32(this.position, value);
    this.position += 4;
  }

  writeUint32(value: number) {
    this.willWrite(4);
    this.view.setUint32(this.position, value);
    this.position += 4;
  }

  writeInt64(value: bigint) {
    this.willWrite(8);
    this.view.setBigInt64(this.position, value);
    this.position += 8;
  }

  writeUint64(value: bigint) {
    this.willWrite(8);
    this.view.setBigUint64(this.position, value);
    this.position += 8;
  }

  writeFloat32(value: number) {
    this.willWrite(4);
    this.view.setFloat32(this.position, value);
    this.position += 4;
  }

  writeFloat64(value: number) {
    this.willWrite(8);
    this.view.setFloat64(this.position, value);
    this.position += 8;
  }

  writeBoolean(value: boolean) {
    this.writeByte(value ? 1 : 0);
  }

  writeString(value: string): void;
  writeString(value: string, len?: number): void;
  writeString(value: string, len?: number) {
    let encoder = new TextEncoder();
    let bytes = encoder.encode(value);
    this.writeBytes(bytes, len);
  }

  readByte() {
    return this.view.getUint8(this.position++);
  }

  readBytes(length: number) {
    let bytes = this.buffer.slice(this.position, this.position + length);
    this.position += length;
    return bytes;
  }

  readInt8() {
    let value = this.view.getInt8(this.position);
    this.position += 1;
    return value;
  }

  readUint8() {
    let value = this.view.getUint8(this.position);
    this.position += 1;
    return value;
  }

  readInt16() {
    let value = this.view.getInt16(this.position);
    this.position += 2;
    return value;
  }

  readUint16() {
    let value = this.view.getUint16(this.position);
    this.position += 2;
    return value;
  }

  readInt32() {
    let value = this.view.getInt32(this.position);
    this.position += 4;
    return value;
  }

  readUint32() {
    let value = this.view.getUint32(this.position);
    this.position += 4;
    return value;
  }

  readInt64() {
    let value = this.view.getBigInt64(this.position);
    this.position += 8;
    return safeNumber(value);
  }

  readUint64() {
    let value = this.view.getBigUint64(this.position);
    this.position += 8;
    return safeNumber(value);
  }

  readFloat32() {
    let value = this.view.getFloat32(this.position);
    this.position += 4;
    return value;
  }

  readFloat64() {
    let value = this.view.getFloat64(this.position);
    this.position += 8;
    return value;
  }

  readBoolean() {
    return this.readByte() === 1;
  }

  readString(length: number) {
    let bytes = this.readBytes(length);
    let decoder = new TextDecoder();
    let a = new Uint8Array(bytes);
    let idx = a.indexOf(0);
    if (idx !== -1) {
      bytes = bytes.slice(0, idx);
    }
    return decoder.decode(bytes);
  }

  readHexString(length: number) {
    let bytes = this.readBytes(length);
    return ArrayBuffers.toHex(bytes);
  }

  writeInt24(value: number) {
    this.writeUint8(value & 0xff);
    this.writeUint16(value >> 8);
  }

  readInt24() {
    return this.readUint8() | (this.readUint16() << 8);
  }

  writeZero(length: number) {
    this.writeBytes(new Uint8Array(length).buffer);
  }

  writeValue(typ: TypedValue['type'], val: TypedValue['value']): void;
  writeValue(tv: TypedValue): void;
  writeValue(a: any, b?: any) {
    const tv: TypedValue = typeof a === 'string' ? { type: a, value: b } : a;
    const { type, value, length } = tv;
    switch (type) {
      case 'uint8':
        this.writeUint8(value);
        break;
      case 'byte':
      case 'int8':
        this.writeInt8(value);
        break;
      case 'uint16':
        this.writeUint16(value);
        break;
      case 'int16':
        this.writeInt16(value);
        break;
      case 'uint32':
        this.writeUint32(value);
        break;
      case 'int32':
        this.writeInt32(value);
        break;
      case 'float32':
        this.writeFloat32(value);
        break;
      case 'float64':
        this.writeFloat64(value);
        break;
      case 'string':
        this.writeString(value, length);
        break;
      case 'boolean':
        this.writeBoolean(value);
        break;
      case 'bytes':
        this.writeBytes(value);
        break;
      default:
        throw new Error(`Unknown type ${type}`);
    }
  }

  readInt() {
    return this.readInt32();
  }

  readFloat() {
    return this.readFloat32();
  }

  readDouble() {
    return this.readFloat64();
  }

  remaining() {
    return this.length - this.position;
  }

  toUint8Array() {
    return new Uint8Array(this.buffer);
  }

  toHex() {
    return ArrayBuffers.toHex(this.buffer);
  }

  toBase64() {
    return ArrayBuffers.toBase64(this.buffer);
  }
}

export interface TypedValue {
  type:
    | 'byte'
    | 'bytes'
    | 'uint8'
    | 'int8'
    | 'uint16'
    | 'int16'
    | 'uint32'
    | 'int32'
    | 'float32'
    | 'float64'
    | 'string'
    | 'boolean';
  value: any;
  length?: number;
}

function safeNumber(n: bigint) {
  if (n > Number.MAX_SAFE_INTEGER) {
    return n;
  }
  return Number(n);
}
