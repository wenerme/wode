import { assert, describe, test } from 'vitest';
import { ByteBuffer } from './ByteBuffer';

describe('ByteBuffer', async () => {
  test('base', () => {
    let buf = new ByteBuffer();
    buf.writeString('Hello');
    buf.writeString('World');
    assert.equal(buf.length, 10);
    assert.equal(buf.position, 10);
    buf.length = 5;
    assert.equal(buf.length, 5);
    buf.position = 0;
    assert.equal(buf.readString(5), 'Hello');
  });

  test('overflow max length', () => {
    let buf = new ByteBuffer();
    buf.writeBytes(new Uint8Array(1025));
    assert.equal(buf.length, 1025);
  });

  test('overflow max length tow step', () => {
    let buf = new ByteBuffer();
    buf.writeBytes(new Uint8Array(1023));
    buf.writeBytes(new Uint8Array(2));
    assert.equal(buf.length, 1025);
    console.log(`Max`, (buf.buffer as any).maxByteLength);
  });

  test('writeBytes fill zero', () => {
    let buf = new ByteBuffer();
    buf.writeBytes(new Uint8Array([1, 2]));
    buf.position = 0;
    // console.log('->', buf.position, buf.length, buf.remaining());
    // console.log(toHexDump(buf.buffer));

    // truncate to size fill zero
    buf.writeBytes(new Uint8Array([1]), 10);
    // console.log('->', buf.position, buf.length, buf.remaining());
    // console.log(toHexDump(buf.buffer));

    assert.equal(buf.view.getInt8(0), 1);
    assert.equal(buf.view.getInt8(1), 0);
    assert.equal(buf.length, 10);
  });
});
