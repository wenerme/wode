export function hexdump(buffer: ArrayBuffer, offset: number = 0, length: number = buffer.byteLength) {
  const view = new DataView(buffer);
  const lines = [];
  for (let i = 0; i < length; i += 16) {
    const bytes = [];
    for (let j = 0; j < 16; j++) {
      let byteOffset = offset + i + j;
      if (byteOffset < length) {
        const byte = view.getUint8(byteOffset);
        bytes.push(byte.toString(16).padStart(2, '0'));
      } else {
        bytes.push('  ');
      }
    }
    lines.push(
      bytes.join(' ') +
        ' '.repeat(3 * (16 - bytes.length)) +
        '  ' +
        bytes.map((b) => (b.length === 1 ? ' ' : '') + String.fromCharCode(parseInt(b, 16))).join(''),
    );
  }
  return lines.join('\n');
}
