import { ArrayBuffers, isDefined } from '@wener/utils';


type AnyBuffer = BufferSource | ArrayBufferLike

function asBuffer(o: AnyBuffer) {
  if (ArrayBuffer.isView(o)) {
    return o.buffer;
  }
  return o;
}

/**
 * @see https://www.egret.uk/docs/egretengine/engine/egret.ByteArray
 * @see https://netty.io/4.1/api/io/netty/buffer/ByteBuf.html
 */
export class ByteArray {
  position = 0;

  #buffer: ArrayBufferLike;
  #view: DataView;

  constructor(buffer: AnyBuffer = new ArrayBuffer(0, { maxByteLength: 1024 })) {
    this.#buffer = asBuffer(buffer);
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
    return this.buffer.byteLength;
  }

  set length(length: number) {
    this.resize(length);
  }

  private ensureSpace(length: number) {
    if (this.remaining() < length) {
      this.resize(this.length + length);
    }
  }

  resize(newLength: number) {
    // Chrome 111, Nodejs 20
    let buf = this.buffer;
    if (buf.resize && (!isDefined(buf.resizable) || buf.resizable)) {
      buf.resize(newLength);
    } else {
      let newBuffer = new ArrayBuffer(newLength);
      new Uint8Array(newBuffer).set(new Uint8Array(buf));
      this.buffer = newBuffer;
    }
  }

  writeByte(value: number) {
    this.ensureSpace(1);
    this.view.setUint8(this.position++, value);
  }

  writeBytes(bytes: ArrayBufferLike) {
    this.ensureSpace(bytes.byteLength);
    new Uint8Array(this.buffer).set(new Uint8Array(bytes), this.position);
    this.position += bytes.byteLength;
  }

  writeInt8(value: number) {
    this.ensureSpace(1);
    this.view.setInt8(this.position, value);
    this.position += 1;
  }

  writeUint8(value: number) {
    this.ensureSpace(1);
    this.view.setUint8(this.position, value);
    this.position += 1;
  }

  writeInt16(value: number) {
    this.ensureSpace(2);
    this.view.setInt16(this.position, value);
    this.position += 2;
  }

  writeUint16(value: number) {
    this.ensureSpace(2);
    this.view.setUint16(this.position, value);
    this.position += 2;
  }

  writeInt32(value: number) {
    this.ensureSpace(4);
    this.view.setInt32(this.position, value);
    this.position += 4;
  }

  writeUint32(value: number) {
    this.ensureSpace(4);
    this.view.setUint32(this.position, value);
    this.position += 4;
  }

  writeInt64(value: bigint) {
    this.ensureSpace(8);
    this.view.setBigInt64(this.position, value);
    this.position += 8;
  }

  writeUint64(value: bigint) {
    this.ensureSpace(8);
    this.view.setBigUint64(this.position, value);
    this.position += 8;
  }

  writeFloat32(value: number) {
    this.ensureSpace(4);
    this.view.setFloat32(this.position, value);
    this.position += 4;
  }

  writeFloat64(value: number) {
    this.ensureSpace(8);
    this.view.setFloat64(this.position, value);
    this.position += 8;
  }

  writeBoolean(value: boolean) {
    this.writeByte(value ? 1 : 0);
  }

  writeString(value: string): void
  writeString(value: string, len?: number): void
  writeString(value: string, len?: number) {
    let encoder = new TextEncoder();
    let bytes = encoder.encode(value);
    this.writeBytes(ArrayBuffers.resize(bytes.buffer, len));
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
    return decoder.decode(bytes).replace(/\0+$/, '');
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

  writeValue(typ: TypedValue['type'], val: TypedValue['value']): void
  writeValue(tv: TypedValue): void
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
    return this.buffer.byteLength - this.position;
  }

  toUint8Array() {
    return new Uint8Array(this.buffer);
  }

  toHex() {
    return ArrayBuffers.toHex(this.buffer);
  }
}

export interface TypedValue {
  type: 'byte' |
    'bytes' | 'uint8' | 'int8' | 'uint16' | 'int16' | 'uint32' | 'int32' | 'float32' | 'float64' | 'string' | 'boolean';
  value: any;
  length?: number;
}

export function toDump(data: BufferSource) {
  return Array.from(ArrayBuffers.toHex(data).match(/.{1,32}/g) ?? []).map((v, i) => {
    let idxPrefix = `${i.toString(16).padStart(8, '0')}:`;
    let content = Array.from(v.match(/.{4}/g) ?? []).join(' ');
    let chars = Array.from((new Uint8Array(ArrayBuffers.fromHex(v).buffer)))
      .map(v => {
        let c = String.fromCharCode(v);
        if (v < 32 || v > 126) {
          c = '.';
        }
        return c;
      });
    return [idxPrefix, content.padEnd(40, ' '), chars.join('')].join(' ');
  }).join('\n');
}

/**
 * Chrome Websocket Binary format
 * ```
 * 00000000: 0000 0000 0000 0000 0000 0000 0000 0000  ................
 * ```
 */
export function fromDump(dump: string) {
  return ArrayBuffers.fromHex(dump.split('\n').map(v => {
    return v.substring(10, 10 + 41).replaceAll(' ', '');
  }).join(''));
}


function safeNumber(n: bigint) {
  if (n > Number.MAX_SAFE_INTEGER) {
    return n;
  }
  return Number(n);
}
