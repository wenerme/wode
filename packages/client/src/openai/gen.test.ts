import { TypeGen } from '@wener/utils/schema/typebox/gen';
import { test } from 'vitest';

test('gen', () => {
  TypeGen.TypeScriptToTypeBox.Generate(`
  interface HI {
    name: string
  }
  `);
});
