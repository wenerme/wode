import test from 'ava';
import { mod31 } from './mod31';

test.failing('mod31', (t) => {
  // fixme mod 31
  t.truthy(mod31('11610582435JGWXMU'));
});
