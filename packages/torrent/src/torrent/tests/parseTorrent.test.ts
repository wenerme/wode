import test from 'ava';
import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { polyfillCrypto } from '@wener/utils/server';
import { Bencode } from '../../bencode/Bencode';
import { parseTorrent } from '../parseTorrent';

const dirname = path.dirname(fileURLToPath(import.meta.url));

test.before(async () => {
  await polyfillCrypto();
});

test('parseFile', async (t) => {
  const files = await globby(path.join(dirname, 'fixtures') + '/*.torrent');
  files.sort();
  for (const file of files) {
    const r = await fs.readFile(file);
    const { pieces, info, torrent, ...rest } = await parseTorrent(r);
    t.snapshot(rest, `should parse ${path.basename(file)}`);
    const encode = Bencode.encode(torrent);
    // await fs.writeFile('a', r);
    // await fs.writeFile('b', Buffer.from(encode));
    t.is(encode.byteLength, r.length, `expected encode ${file} to ${r.length}`);
    t.is(Bencode.byteLength(torrent), r.length, `expected byteLength ${r.length}`);
    t.deepEqual(r, Buffer.from(encode), `should encode ${path.basename(file)}`);
  }
});
