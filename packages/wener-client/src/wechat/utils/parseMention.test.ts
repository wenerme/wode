import { expect, test } from 'vitest';
import { parseMention } from './parseMention';

test('parseMention', () => {
  for (const [a, b] of [
    //
    ['', []],
    ['Hi', ['Hi']],
    ['@A Hi', [{ start: 0, end: 3, mention: 'A' }, 'Hi']],
    ['@A @B Hi', [{ start: 0, end: 3, mention: 'A' }, { start: 3, end: 6, mention: 'B' }, 'Hi']],
    [
      '@A @B @C Hi',
      [
        { start: 0, end: 3, mention: 'A' },
        { start: 3, end: 6, mention: 'B' },
        { start: 6, end: 9, mention: 'C' },
        'Hi',
      ],
    ],
  ] as Array<[string, any]>) {
    expect(parseMention(a)).toMatchObject(b);
  }
});
