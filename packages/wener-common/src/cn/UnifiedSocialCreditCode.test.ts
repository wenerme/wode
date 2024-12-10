import { describe, expect, it } from 'vitest';
import { UnifiedSocialCreditCode } from './UnifiedSocialCreditCode';

describe('UnifiedSocialCreditCode', () => {
  it('should parse', () => {
    for (const a of [
      //
      '91330106673959654P',
      '91330106MA2CFLDG4R',
    ]) {
      let out = UnifiedSocialCreditCode.parse(a);
      expect(UnifiedSocialCreditCode.format(out)).toBe(a);
      expect(out).toMatchSnapshot();
    }
  });
});
