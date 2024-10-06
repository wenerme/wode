import { assert, test } from 'vitest';
import { DynamicStore } from './DynamicStore';
import type { ModuleStore } from './types';

test('DynamicStore', () => {
  let store: ModuleStore = new DynamicStore();
  {
    const s = store.as<Val>();
    s.add('a.b', 1);
    s.add('a.b', [2]);
    assert.deepEqual(s.collect('a.b'), [1, 2]);
  }
});

interface Val {
  a: {
    b: string[];
  };
}
