import test from 'ava';
import { Buffer } from './Buffer';
import { isBuffer } from './isBuffer';

test('basic', (t) => {
  {
    const buf = new Buffer(0);
    t.true(Buffer.isBuffer(buf));
    t.true(isBuffer(buf));
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
