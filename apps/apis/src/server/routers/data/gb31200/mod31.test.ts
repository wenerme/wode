import { test, expect } from 'vitest';
import { mod31 } from './mod31';

test.fails('mod31', (t) => {
  // fixme mod 31
  expect(mod31('11610582435JGWXMU')).toBeTruthy();
});
