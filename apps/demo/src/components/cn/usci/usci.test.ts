import test from 'ava';
import { checkUSCI } from './checkUSCI';
import { randomUSCI } from './randomUSCI';
import { parseUSCI } from './usci';

test('verify', (t) => {
  t.true(checkUSCI('91310000775785552L'));
  t.true(checkUSCI('91350100M000100Y43'));
  t.deepEqual(randomUSCI(parseUSCI('91350100M000100Y43')), parseUSCI('91350100M000100Y43'));
  t.true(checkUSCI(randomUSCI({}).raw));
});
