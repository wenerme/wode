// lib & rlb

export interface ImageInfo {
  index: number;
  width: number;
  height: number;
  size: number;
  offset: number;
  name: string;
  type: string;
  file: string;
  data: Uint8Array;
}

export function loadImages({ data, hasName }: { data: ArrayBuffer; hasName?: boolean }) {
  // https://github.com/wenerme/bbvm/blob/764e6f07536ca9e530be76110a641346f2294cb4/jbbvm/bbvm-core/src/main/java/me/wener/bbvm/dev/swing/Images.java#L84

  const littleEndian = false;
  const list: ImageInfo[] = [];
  const buf = new DataView(data);
  let offset = 0;

  const n = buf.getInt32(offset, littleEndian);
  offset += 4;

  if (n > 65535 || n < 0) {
    throw new Error(`Invalid image count: ${n}`);
  }

  for (let i = 0; i < n; i++) {
    const info: ImageInfo = {
      index: i,
      width: buf.getUint16(offset, littleEndian),
      height: buf.getUint16(offset + 2, littleEndian),
      size: buf.getInt32(offset + 4, littleEndian),
      offset: buf.getInt32(offset + 8, littleEndian),
      name: '',
      type: '',
      file: '',
      data: new Uint8Array(0),
    };
    offset += 12;
    if (hasName) {
      const name = new Uint8Array(data, offset, 32);
      const nameEnd = name.indexOf(0);
      if (nameEnd > 0) {
        // fixme maybe gbk
        info.name = new TextDecoder().decode(name.slice(0, nameEnd));
      }
      offset += 32;
    }
    list.push(info);
  }

  // Load all offset

  /*
            // Load all offset
            final ByteBuf buf = Unpooled.wrappedBuffer(ch.map(FileChannel.MapMode.READ_ONLY, 4, n * (4 + (hasName ? 32 : 0)))).order(order);
            List<ImageInfo> list = new ArrayList<>(n);
            for (int i = 0; i < n; i++) {
                int offset = buf.readInt();
                String name = null;
                if (hasName) {
                    int length = buf.bytesBefore(32, (byte) 0);
                    if (length > 0) {
                        name = buf.toString(buf.readerIndex(), length, StandardCharsets.UTF_8);
                    }
                    buf.skipBytes(32);
                }
                if (name == null) {
                    name = "NO-" + i;
                }
                ImageInfo info = new ImageInfo(i, name, offset, file.toString(), type);

                ByteBuf header = Unpooled.wrappedBuffer(ch.map(FileChannel.MapMode.READ_ONLY, offset, 12)).order(order);
                info.setSize(header.readInt() - 12)
                    .setWidth(header.readUnsignedShort())
                    .setHeight(header.readUnsignedShort());

                if (expectedBits > 0 && info.getBits() != expectedBits) {
                    throw new UnsupportedOperationException("Expected bits " + expectedBits + " but got " + info.getBits());
                }

                list.add(info);

            }
            return list;
 */
  return list;
}
