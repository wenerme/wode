import { expect, test } from 'vitest';
import { ArrayBuffers } from './ArrayBuffers';

test('concat', () => {
  const check = (Type: any = Uint8Array, va = [1, 2, 3], vb = [4, 5, 6]) => {
    const a = new Type(va);
    const b = new Type(vb);
    expect(ArrayBuffers.concat([a, b]), `should concat ${Type}`).toStrictEqual(new Type([...va, ...vb]).buffer);
  };
  check(Uint8Array);
  check(Uint16Array, [0xff, 0xffff]);
  check(Uint32Array, [0xfffffff]);
});

test('asView for Buffer', () => {
  const buf = Buffer.from([1, 2, 3, 4, 5]);
  expect(ArrayBuffers.asView(Buffer, buf)).toBe(buf);
  const uint8 = ArrayBuffers.asView(Uint8Array, buf);
  expect(ArrayBuffers.asView(Buffer, uint8).buffer).toBe(buf.buffer);

  expect(uint8).toEqual(buf);
  expect(ArrayBuffers.asView(Buffer, uint8)).toEqual(buf);
});
