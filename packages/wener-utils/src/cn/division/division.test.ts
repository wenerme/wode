import { expect, test } from 'vitest';
import { DivisionCode } from './DivisionCode';

test('division', () => {
  for (const [a, b] of [
    [
      '441900003001',
      {
        province: '44',
        city: '19',
        county: '00',
        town: '003',
        village: '001',
      },
    ],
    ['31', { province: '31' }],
    ['4', undefined],
    ['', undefined],
  ] as Array<[string, any]>) {
    expect(DivisionCode.parse(a)).toMatchObject(b);
  }
});
