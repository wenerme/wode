/**
 * @see {@link https://github.com/protobufjs/bytebuffer.js protobufjs/bytebuffer.js}
 * @see {@link https://netty.io/4.1/api/io/netty/buffer/ByteBuf.html ByteBuf}
 */
export class ByteBuffer {
  static LITTLE_ENDIAN = true;
  static BIG_ENDIAN = false;
  static DEFAULT_ENDIAN = ByteBuffer.BIG_ENDIAN;

  static DEFAULT_CAPACITY = 16;

  readonly buffer: ArrayBuffer;
  readonly view: DataView;
  limit = 0;
  offset = 0;
  markedOffset = -1;
  littleEndian;

  constructor({
    capacity = ByteBuffer.DEFAULT_CAPACITY,
    buffer = new ArrayBuffer(capacity),
    view = new DataView(buffer),
    littleEndian = ByteBuffer.DEFAULT_ENDIAN,
    offset = 0,
  }: { buffer?: ArrayBuffer; littleEndian?: boolean; view?: DataView; capacity?: number; offset?: number } = {}) {
    this.buffer = buffer;
    this.view = view;
    this.offset = offset;
    this.limit = capacity;
    this.littleEndian = littleEndian;
  }

  static isByteBuffer(v: any): v is ByteBuffer {
    return (
      v != null &&
      v.constructor != null &&
      typeof v.constructor.isByteBuffer === 'function' &&
      v.constructor.isByteBuffer(v)
    );
  }
}

Object.defineProperty(ByteBuffer.prototype, 'isByteBuffer', {
  value: () => true,
  enumerable: false,
  configurable: false,
});
