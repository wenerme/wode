import { Readable } from 'node:stream';
import { test } from 'vitest';
import { parseApkIndexArchive, parseApkIndexContent } from './apkindex';

test('parse', async () => {
  // https://mirrors.tuna.tsinghua.edu.cn/alpine/
  const rd = Readable.from(
    Buffer.from(
      await fetch('https://mirrors.tuna.tsinghua.edu.cn/alpine/v3.17/main/x86_64/APKINDEX.tar.gz').then((v) =>
        v.arrayBuffer(),
      ),
    ),
  );
  let { content } = await parseApkIndexArchive(rd);
  const pkgs = parseApkIndexContent(content);
  console.log(pkgs.slice(0, 3));
});
