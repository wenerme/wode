import fs from 'node:fs/promises';
import path from 'node:path';
import { describe } from 'node:test';
import { fileURLToPath } from 'node:url';
import { polyfillCrypto } from '@wener/utils/server';
import { globby } from 'globby';
import { expect, test } from 'vitest';
import { Bencode } from '../bencode/Bencode';
import { parseTorrent } from './parseTorrent';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('parseTorrent', async () => {
  await polyfillCrypto();

  test('parseFile', async (t) => {
    const files = await globby(path.join(dirname, 'fixtures') + '/*.torrent');
    files.sort();
    for (const file of files) {
      const r = await fs.readFile(file);
      const { pieces, info, torrent, ...rest } = await parseTorrent(r);
      expect(rest, `should parse ${path.basename(file)}`).toMatchSnapshot();
      const encode = Bencode.encode(torrent);
      // await fs.writeFile('a', r);
      // await fs.writeFile('b', Buffer.from(encode));

      expect(encode.byteLength, `expected encode ${file} to ${r.length}`).toBe(r.length);
      expect(Bencode.byteLength(torrent), `expected byteLength ${r.length}`).toBe(r.length);
      expect(r, `should encode ${path.basename(file)}`).toEqual(Buffer.from(encode));
    }
  });
});
