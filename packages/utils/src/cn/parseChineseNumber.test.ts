import { expect, test } from 'vitest';
import { parseChineseNumber } from './parseChineseNumber';

test('parseChineseNumber', () => {
  for (const [a, b] of [
    ['0', 0],
    ['10000', 10_000],
    ['123', 123],
    ['一万', 10_000],
    ['一万一', 10_001],
    ['一万一百一', 10_101],
    ['一万零一百零一', 10_101],
    ['一千零一十', 1010],
    ['一千零一十一', 1011],
    ['一捌玖', 189],
    ['一百一', 101],
    ['一百九十二', 192],
    ['捌玖', 89],
    ['捌玖零', 890],
    ['零捌玖', 89],
  ] as const) {
    expect(parseChineseNumber(a)).toBe(b);
  }
});
