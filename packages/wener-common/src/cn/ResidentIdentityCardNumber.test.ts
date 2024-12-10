import { describe, expect, it } from 'vitest';
import { ResidentIdentityCardNumber } from './ResidentIdentityCardNumber';

describe('ResidentIdentityCardNumber', () => {
  it('should parse', () => {
    for (const a of ['11010519491231002X']) {
      let out = ResidentIdentityCardNumber.parse(a);
      expect(ResidentIdentityCardNumber.format(out)).toBe(a);
      expect(out).toMatchSnapshot();
    }
  });
  it('should format with partial', () => {
    expect(
      ResidentIdentityCardNumber.format({
        division: '110105',
        birthDate: new Date('1949-12-31'),
        sequence: 2,
      }),
    ).toBe('11010519491231002X');
  });
});
