import { expect, test } from 'vitest';
import { toMiniQueryAST } from './ast';

test('miniquery ast', (t) => {
  for (const v of [`a > -1`]) {
    const ast = toMiniQueryAST(v);
    expect(ast).toBeTruthy();
  }
});
