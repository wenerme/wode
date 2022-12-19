import test from 'ava';
import { toMiniQueryAST } from './ast';

test('miniquery ast', (t) => {
  for (const v of [`a > -1`]) {
    const ast = toMiniQueryAST(v);
    t.truthy(ast);
  }
});
