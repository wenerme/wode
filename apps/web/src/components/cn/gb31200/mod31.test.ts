import { expect, test } from 'vitest';
import { mod31 } from './mod31';

test.fails('mod31', () => {
  // fixme mod 31
  expect(mod31('11610582435JGWXMU')).toBeFalsy();
});
