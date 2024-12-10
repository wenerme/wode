import { describe, expect, it } from 'vitest';
import { DivisionCode } from './DivisionCode';

describe('DivisionCode', () => {
  it('should parse', () => {
    for (const [a, b] of [
      [
        '441900003001',
        {
          province: '44',
          city: '19',
          county: '00',
          town: '003',
          village: '001',
          codes: ['44', '19', '00', '003', '001'],
        },
      ],
      [
        441900003001,
        {
          province: '44',
          city: '19',
          county: '00',
          town: '003',
          village: '001',
          codes: ['44', '19', '00', '003', '001'],
        },
      ],
      [
        441900,
        {
          province: '44',
          city: '19',
          county: '00',
        },
      ],
      ['31', { province: '31' }],
      ['4', undefined],
      ['', undefined],
      [null, undefined],
      [undefined, undefined],
    ] as Array<[string, any]>) {
      let out = DivisionCode.parse(a);
      expect(out).toMatchObject(b);
      if (out) {
        expect(DivisionCode.format(out)).toBe(String(a));
      }
    }
  });
});
