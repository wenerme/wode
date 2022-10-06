import test from 'ava';
import { Buffer } from 'node:buffer';
import { classOf } from '../langs/classOf';
import { isBuffer } from './isBuffer';

test('isBuffer', (t) => {
  t.true(isBuffer(Buffer.from('')));
  t.is(classOf(Buffer), 'Function');
});
