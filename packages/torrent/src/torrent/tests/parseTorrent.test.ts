import test from 'ava';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseTorrent } from '../parseTorrent';
import { polyfillCrypto } from '@wener/utils/server';
import { globby } from 'globby';

var __dirname = path.dirname(fileURLToPath(import.meta.url));

test.before(async () => {
  await polyfillCrypto();
});

test('parseFile', async (t) => {
  const files = await globby(path.join(__dirname, 'fixtures') + '/*.torrent');
  files.sort();
  for (const file of files) {
    const r = await fs.readFile(file);
    let { pieces, info, torrent, ...rest } = await parseTorrent(r);
    t.snapshot(rest, `should parse ${path.basename(file)}`);
  }
});
