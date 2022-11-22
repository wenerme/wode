import test from 'ava';
import { checkUsci } from './checkUsci';
import { randomUsci } from './randomUsci';
import { parseUsic } from './usic';

test('verify', (t) => {
  t.true(checkUsci('91310000775785552L'));
  t.true(checkUsci('91350100M000100Y43'));
  t.deepEqual(randomUsci(parseUsic('91350100M000100Y43')), parseUsic('91350100M000100Y43'));
  t.true(checkUsci(randomUsci({}).raw));
});
