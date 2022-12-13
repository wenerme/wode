import test from 'ava';
import { next, UnifiedSocialCreditId } from './UnifiedSocialCreditId';

test('next', (t) => {
  t.is(next('ABC', 1), 'ABD');
  t.is(next('ABC', -1), 'ABB');
  t.is(next('ABY', +1), 'AC0');
  t.is(next('AB0', -1), 'AAY');
  t.is(next('AYY', +1), 'B00');
  t.is(next('B00', -1), 'AYY');
});

test('UnifiedSocialCreditId', (t) => {
  const { bureau, subtype, division, subject, sum, valid } = UnifiedSocialCreditId.parse('91310000775785552L');
  t.deepEqual(
    { bureau, subtype: subtype, division, subject, sum, valid },
    {
      bureau: '9',
      subtype: '1',
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
