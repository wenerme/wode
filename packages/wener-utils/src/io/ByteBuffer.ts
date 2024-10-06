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
 * @see {@link https://netty.io/4.1/api/io/netty/buffer/ByteBuf.html io.netty.buffer.ByteBuf}
 * @see {@link https://nodejs.org/api/buffer.html node:buffer}
 * @see {@link https://www.postgresql.org/docs/current/datatype.html PostgreSQL Data Types}
 */
export class ByteBuffer {
  position = 0;

  #buffer: ArrayBufferLike;
  #view: DataView;
  #bytes: Uint8Array;
  // #endian: 'big' | 'little' = 'big';
  #bigEndian = true;

  constructor(buffer: AnyBuffer = new ArrayBuffer(0, { maxByteLength: 1024 })) {
    this.#buffer = asBuffer(buffer);
    // NOTE prefer view over buffer, avoid the slice overhead ?
    this.#view = new DataView(this.#buffer);
    this.#bytes = new Uint8Array(this.#buffer);
  }

  get littleEndian() {
    return !this.#bigEndian;
  }

  set littleEndian(v: boolean) {
    this.#bigEndian = !v;
  }

  get bigEndian() {
    return this.#bigEndian;
  }

  set bigEndian(v: boolean) {
    this.#bigEndian = v;
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
    this.#bytes = new Uint8Array(this.#buffer);
  }

  get bytes(): Uint8Array {
    return this.#bytes;
  }

  get length() {
    return this.view.byteLength;
  }

  set length(length: number) {
    this.resize(length);
  }

  resize(newLength: number) {
    // 1.2 for buffer growth
    this.buffer = ArrayBuffers.resize(this.buffer, newLength, Math.ceil(newLength * 1.2));
  }

  writeByte(value: number) {
    this.willWrite(1);
    this.view.setUint8(this.position++, value);
  }

  writeBytes(bytes: ArrayBufferLike, len: number = bytes.byteLength) {
    this.willWrite(len);
    // ensure len first
    this.bytes.set(new Uint8Array(bytes).subarray(0, len), this.position);
    if (len > bytes.byteLength) {
      // fill zero
      this.bytes.fill(0, this.position + bytes.byteLength, this.position + len);
    }

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
    this.view.setInt16(this.position, value, this.littleEndian);
    this.position += 2;
  }

  writeUint16(value: number) {
    this.willWrite(2);
    this.view.setUint16(this.position, value, this.littleEndian);
    this.position += 2;
  }

  writeUint24(value: number) {
    this.willWrite(3);
    this.view.setUint8(this.position, value & 0xff);
    this.view.setUint16(this.position + 1, value >> 8, this.littleEndian);
    this.position += 3;
  }

  writeInt32(value: number) {
    this.willWrite(4);
    this.view.setInt32(this.position, value, this.littleEndian);
    this.position += 4;
  }

  writeUint32(value: number) {
    this.willWrite(4);
    this.view.setUint32(this.position, value, this.littleEndian);
    this.position += 4;
  }

  writeInt64(value: bigint | number) {
    this.willWrite(8);
    this.view.setBigInt64(this.position, bigintOf(value), this.littleEndian);
    this.position += 8;
  }

  writeUint64(value: bigint | number) {
    this.willWrite(8);
    this.view.setBigUint64(this.position, bigintOf(value), this.littleEndian);
    this.position += 8;
  }

  writeFloat32(value: number) {
    this.willWrite(4);
    this.view.setFloat32(this.position, value, this.littleEndian);
    this.position += 4;
  }

  writeFloat64(value: number) {
    this.willWrite(8);
    this.view.setFloat64(this.position, value, this.littleEndian);
    this.position += 8;
  }

  writeBoolean(value: boolean) {
    this.writeByte(value ? 1 : 0);
  }

  writeString(value: string): void;

  writeString(value: string, len?: number): void;

  writeString(value: string, len?: number) {
    let bytes = this.encodeText(value);
    this.writeBytes(bytes, len);
  }

  readSizeString(n?: number) {
    return this.readString(requireNumber(this.readUint(n)));
  }

  writeSizeString(value: string, n?: number) {
    let out = this.encodeText(value);
    this.writeUint(out.length, n);
    this.writeBytes(out);
  }

  encodeText(value: string) {
    return new TextEncoder().encode(value);
  }

  decodeText(bytes: ArrayBufferLike) {
    return new TextDecoder().decode(bytes);
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

  readUnsignedByte() {
    return this.readUint8();
  }

  readThrough(end: number) {
    // readUntil 不包含 end
    let idx = this.bytes.indexOf(end, this.position);
    if (idx === -1) {
      throw new Error(`Byte ${end} not found starting from position ${this.position}`);
    }
    let bytes = this.buffer.slice(this.position, idx + 1);
    this.position = idx + 1;
    return bytes;
  }

  readInt16() {
    let value = this.view.getInt16(this.position, this.littleEndian);
    this.position += 2;
    return value;
  }

  readUint16() {
    let value = this.view.getUint16(this.position, this.littleEndian);
    this.position += 2;
    return value;
  }

  readInt32() {
    let value = this.view.getInt32(this.position, this.littleEndian);
    this.position += 4;
    return value;
  }

  readUint32() {
    let value = this.view.getUint32(this.position, this.littleEndian);
    this.position += 4;
    return value;
  }

  readInt64() {
    let value = this.view.getBigInt64(this.position, this.littleEndian);
    this.position += 8;
    return safeNumber(value);
  }

  readUint64() {
    let value = this.view.getBigUint64(this.position, this.littleEndian);
    this.position += 8;
    return safeNumber(value);
  }

  readFloat32() {
    let value = this.view.getFloat32(this.position, this.littleEndian);
    this.position += 4;
    return value;
  }

  readFloat64() {
    let value = this.view.getFloat64(this.position, this.littleEndian);
    this.position += 8;
    return value;
  }

  readBoolean() {
    // or !== 0?
    return this.readByte() === 1;
  }

  readString(length: number): string {
    let bytes = this.readBytes(length);
    let a = new Uint8Array(bytes);
    let idx = a.indexOf(0);
    if (idx !== -1) {
      bytes = bytes.slice(0, idx);
    }
    return this.decodeText(bytes);
  }

  readHexString(length: number) {
    let bytes = this.readBytes(length);
    return ArrayBuffers.toHex(bytes);
  }

  writeHexString(value: string, len?: number) {
    this.writeBytes(ArrayBuffers.fromHex(value), len);
  }

  writeInt24(value: number) {
    // fixme byte order
    this.writeUint8(value & 0xff);
    this.writeUint16(value >> 8);
  }

  readInt24() {
    // fixme recheck
    let value = this.readUint24();
    if (value & 0x800000) {
      // If the sign bit is set, extend the sign
      value |= 0xff000000;
    }
    return value;
  }

  readUint24() {
    // fixme recheck
    return this.readUint8() | (this.readUint8() << 8) | (this.readUint8() << 16);
  }

  writeZero(length: number) {
    this.willWrite(length);
    this.bytes.fill(0, this.position, this.position + length);
    this.position += length;
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
      case 'uint24':
        this.writeUint24(value);
        break;
      case 'int24':
        this.writeInt24(value);
        break;
      case 'uint32':
      case 'uint':
        this.writeUint32(value);
        break;
      case 'int32':
      case 'int':
        this.writeInt32(value);
        break;
      case 'float32':
      case 'float':
        this.writeFloat32(value);
        break;
      case 'float64':
      case 'double':
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

  readUnsignedShort() {
    return this.readUint16();
  }

  readShort() {
    return this.readInt16();
  }

  readInt(bytesOrBits: number = 32) {
    switch (bytesOrBits) {
      case 1:
      case 8:
        return this.readInt8();
      case 2:
      case 16:
        return this.readInt16();
      case 3:
      case 24:
        return this.readInt24();
      case 4:
      case 32:
        return this.readInt32();
      // skip 8 byte for bits
      case 64:
        return this.readInt64();
      default:
        throw new Error(`Unknown int${bytesOrBits}`);
    }
  }

  readUint(bytesOrBits: number = 32) {
    switch (bytesOrBits) {
      case 1:
      case 8:
        return this.readUint8();
      case 2:
      case 16:
        return this.readUint16();
      case 3:
      case 24:
        return this.readUint24();
      case 4:
      case 32:
        return this.readUint32();
      // skip 8 byte for bits
      case 64:
        return this.readUint64();
      default:
        throw new Error(`Unexpected int size: ${bytesOrBits}`);
    }
  }

  writeUint(value: number, bytesOrBits: number = 32) {
    switch (bytesOrBits) {
      case 1:
      case 8:
        this.writeUint8(value);
        break;
      case 2:
      case 16:
        this.writeUint16(value);
        break;
      case 3:
      case 24:
        this.writeUint24(value);
        break;
      case 4:
      case 32:
        this.writeUint32(value);
        break;
      case 64:
        this.writeUint64(value);
        break;
      default:
        throw new Error(`Unexpected uint size: ${bytesOrBits}`);
    }
  }

  readFloat(n: number = 32) {
    switch (n) {
      case 4:
      case 32:
        return this.readFloat32();
      case 8:
      case 64:
        return this.readFloat64();
      default:
        throw new Error(`Unexpected float size: ${n}`);
    }
  }

  writeFloat(value: number, n: number = 32) {
    switch (n) {
      case 4:
      case 32:
        this.writeFloat32(value);
        break;
      case 8:
      case 64:
        this.writeFloat64(value);
        break;
      default:
        throw new Error(`Unexpected float size: ${n}`);
    }
  }

  readDouble() {
    return this.readFloat64();
  }

  writeDouble(value: number) {
    this.writeFloat64(value);
  }

  remaining() {
    return this.length - this.position;
  }

  hasRemaining() {
    return this.remaining() > 0;
  }

  readRemaining() {
    return this.readBytes(this.remaining());
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

  private willWrite(length: number) {
    if (this.remaining() < length) {
      this.resize(this.position + length);
    }
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
    | 'uint24'
    | 'int24'
    | 'int'
    | 'uint'
    | 'uint32'
    | 'int32'
    | 'float'
    | 'float32'
    | 'double'
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

function bigintOf(n: number | bigint) {
  if (typeof n === 'bigint') {
    return n;
  }
  return BigInt(n);
}

function requireNumber(n: number | bigint) {
  if (typeof n !== 'number') {
    throw new Error(`Expected number, got ${n}`);
  }
  return n;
}
