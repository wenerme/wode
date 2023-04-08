import { Buffer } from 'node:buffer';
import { expect, test } from 'vitest';
import { classOf } from '../langs/classOf';
import { isBuffer } from './isBuffer';

test('isBuffer', () => {
  expect(isBuffer(Buffer.from(''))).toBeTruthy();
  expect(classOf(Buffer)).toBe('Function');
});
