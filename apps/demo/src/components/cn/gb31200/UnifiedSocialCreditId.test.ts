import { test, assert } from 'vitest';
import { next, UnifiedSocialCreditId } from './UnifiedSocialCreditId';

test('next', () => {
  assert.equal(next('ABC', 1), 'ABD');
  assert.equal(next('ABC', -1), 'ABB');
  assert.equal(next('ABY', +1), 'AC0');
  assert.equal(next('AB0', -1), 'AAY');
  assert.equal(next('AYY', +1), 'B00');
  assert.equal(next('B00', -1), 'AYY');
});

test('UnifiedSocialCreditId', () => {
  const { bureau, subtype, division, subject, sum, valid } = UnifiedSocialCreditId.parse('91310000775785552L');
  assert.deepEqual(
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
    assert.isTrue(UnifiedSocialCreditId.random().valid);
  }
});
