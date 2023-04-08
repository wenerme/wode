import { test, assert } from 'vitest';
import { checkUSCI } from './checkUSCI';
import { randomUSCI } from './randomUSCI';
import { parseUSCI } from './usci';

test('verify', () => {
  assert.isTrue(checkUSCI('91310000775785552L'));
  assert.isTrue(checkUSCI('91350100M000100Y43'));
  assert.deepEqual(randomUSCI(parseUSCI('91350100M000100Y43')), parseUSCI('91350100M000100Y43'));
  assert.isTrue(checkUSCI(randomUSCI({}).raw));
});
