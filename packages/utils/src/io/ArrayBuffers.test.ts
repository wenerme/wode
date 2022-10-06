import test from 'ava';
import { ArrayBuffers } from './ArrayBuffers';

test('concat', (t) => {
  const check = (Type: any = Uint8Array, va = [1, 2, 3], vb = [4, 5, 6]) => {
    const a = new Type(va);
    const b = new Type(vb);
    t.deepEqual(ArrayBuffers.concat([a, b]), new Type([...va, ...vb]).buffer, `should concat ${Type}`);
  };
  check(Uint8Array);
  check(Uint16Array, [0xff, 0xffff]);
  check(Uint32Array, [0xfffffff]);
});

test('asView for Buffer', (t) => {
  const buf = Buffer.from([1, 2, 3, 4, 5]);
  t.is(ArrayBuffers.asView(Buffer, buf), buf);
  let uint8: Uint8Array = ArrayBuffers.asView(Uint8Array, buf);
  t.is((ArrayBuffers.asView(Buffer, uint8) as Buffer).buffer, buf.buffer);

  t.deepEqual(uint8, buf);
  t.deepEqual(ArrayBuffers.asView(Buffer, uint8), buf);
});
