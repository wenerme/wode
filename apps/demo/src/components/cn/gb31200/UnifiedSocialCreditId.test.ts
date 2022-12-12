import test from 'ava';
import { UnifiedSocialCreditId } from './UnifiedSocialCreditId';

test('UnifiedSocialCreditId', (t) => {
  const { bureau, subtype, division, subject, sum, valid } = UnifiedSocialCreditId.parse('91310000775785552L');
  t.deepEqual(
    { bureau, subtype: subtype, division, subject, sum, valid },
    {
      bureau: '9',
      type: '1',
      division: '310000',
      subject: '775785552',
      sum: 'L',
      valid: true,
    },
  );
  for (let i = 0; i < 100; i++) {
    t.true(UnifiedSocialCreditId.random().valid);
  }
});
