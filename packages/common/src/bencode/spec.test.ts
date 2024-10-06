import { assert, test } from 'vitest';

test('typed copy typed', () => {
  const raw = Uint8Array.from([1, 2, 3, 4, 5]);
  const buf = new Uint8Array(raw);
  assert.notEqual(raw.buffer, buf.buffer);
  assert.deepEqual(raw.buffer, buf.buffer);
});

test('view offset & length', () => {
  const raw = Uint8Array.from([1, 2, 3, 4, 5]).buffer;
  const buf = new Uint8Array(raw, 1, 3);
  assert.equal(buf.buffer, raw);
  // offset & length
  assert.equal(buf.toString(), '2,3,4');
  assert.equal(buf[0], 2);
  assert.deepEqual([...buf.slice(0, 4).values()], [2, 3, 4]);
  assert.deepEqual([...buf.subarray(0, 4).values()], [2, 3, 4]);
  assert.deepEqual(buf.slice(1, 4)[0], 3);
});
