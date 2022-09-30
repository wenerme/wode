import test from 'ava';
import { Buffer } from 'node:buffer';
import { isTransferable } from './isTransferable';

test('isTransferable', (t) => {
  t.false(isTransferable(0));
  t.false(isTransferable(Buffer.from('')));
  t.true(new ArrayBuffer(0) instanceof ArrayBuffer);
  t.true(isTransferable(new ArrayBuffer(0)));
});
