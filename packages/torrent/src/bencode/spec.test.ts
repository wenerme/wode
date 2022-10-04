import test from 'ava';
import { Buffer } from 'node:buffer';

test('typed copy typed', (t) => {
  let raw = Uint8Array.from([1, 2, 3, 4, 5]);
  let buf = new Uint8Array(raw);
  t.not(raw.buffer, buf.buffer);
  t.deepEqual(raw.buffer, buf.buffer);
});

test('view offset & length', (t) => {
  let raw = Uint8Array.from([1, 2, 3, 4, 5]).buffer;
  let buf = new Uint8Array(raw, 1, 3);
  t.is(buf.buffer, raw);
  // offset & length
  t.is(buf.toString(), '2,3,4');
  t.is(buf[0], 2);
  t.deepEqual([...buf.slice(0, 4).values()], [2, 3, 4]);
  t.deepEqual([...buf.subarray(0, 4).values()], [2, 3, 4]);
  t.deepEqual(buf.slice(1, 4)[0], 3);
});

test('buffer slice', (t) => {
  console.log(new Uint8Array(Buffer.from('1234').buffer).slice(1, 3).toString());
  t.pass();
});
