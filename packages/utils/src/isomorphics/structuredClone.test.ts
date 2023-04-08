import { expect, test } from 'vitest';
import { classOf } from '../langs/classOf';
import { _clone } from './structuredClone';

test('structuredClone', () => {
  for (const [k, v] of [
    ['', ''],
    [Number(1), 1],
  ]) {
    const c = _clone(k);
    expect(c).toEqual(v);
    expect(classOf(c)).toBe(classOf(v));
  }
});
