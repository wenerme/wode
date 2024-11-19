import fs from 'node:fs/promises';
import { test } from 'vitest';
import { generateSchema } from './generateSchema';

test('schema/gen', async ({}) => {
  const __dirname = new URL('.', import.meta.url).pathname;
  const files = await fs.readdir(__dirname);
  for (let file of files) {
    if (!file.endsWith('d.ts')) {
      continue;
    }

    await generateSchema({
      file: `${__dirname}/${file}`,
    });
  }
});
