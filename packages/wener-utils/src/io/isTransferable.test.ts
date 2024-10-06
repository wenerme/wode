import { Buffer } from 'node:buffer';
import { expect, test } from 'vitest';
import { isTransferable } from './isTransferable';

test('isTransferable', () => {
  expect(isTransferable(0)).toBeFalsy();
  expect(isTransferable(Buffer.from(''))).toBeFalsy();

  expect(new ArrayBuffer(0) instanceof ArrayBuffer).toBeTruthy();
  expect(isTransferable(new ArrayBuffer(0))).toBeTruthy();
});
