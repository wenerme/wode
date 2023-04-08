import { test, expect } from 'vitest';
import { Buffer } from './Buffer';
import { isBuffer } from './isBuffer';

test('basic', () => {
  {
    const buf = new Buffer(0);
    expect(Buffer.isBuffer(buf)).toBeTruthy();
    expect(isBuffer(buf)).toBeTruthy();
  }
  // const b = new Buffer(10)
  // t.is(b.length,10)
  // t.is(b.byteLength,10)
  // t.is(b.byteOffset,0)
  // t.is(b.buffer.byteLength,10)
  // t.is(b.buffer.byteOffset,0)
  // t.is(b.buffer.length,1)
  // t.is(b.buffer[0].byteLength,10)
  // t.is(b.buffer[0].byteOffset,0)
  // t.is(b.buffer[0].length,10)
  // t.is(b.buffer[0][0],0)
  // t.is(b.buffer[0][9],0)
});
