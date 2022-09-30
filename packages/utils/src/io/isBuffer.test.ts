import test from 'ava';
import { Buffer } from 'node:buffer';
import { isBuffer } from './isBuffer';

test('isBuffer', (t) => {
  t.true(isBuffer(Buffer.from('')));
});
