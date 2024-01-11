import { TypeGen } from '.';
import { test } from 'vitest';

test('type gen', () => {
  console.log(
    TypeGen.TypeScriptToTypeBox.Generate(`
  interface HI {
    name: string
  }
`),
  );
});
