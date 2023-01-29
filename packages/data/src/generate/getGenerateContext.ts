import fs from 'node:fs/promises';
import path from 'node:path';
import { formatBytes, type MaybePromise } from '@wener/utils';
import { getPackageRootDir } from '../cn/utils/getPackageRootDir';
import { cache } from './cache';

let _root: GenerateContext;

export interface GenerateContext {
  pkgDir: string;
  rootDataDir: string;
  rootCacheDir: string;
  dataDir: string;
  cacheDir: string;
  srcDir: string;
  cache: (url: string) => Promise<string>;
  writeData: (path: string, content: string) => Promise<void>;
  writeSrc: (path: string, content: string) => Promise<void>;
}

export function getGenerateContext(prefix?: string): MaybePromise<GenerateContext> {
  if (prefix) {
    return Promise.resolve(getGenerateContext()).then((c) => {
      const cacheDir = path.resolve(c.cacheDir, prefix);
      const dataDir = path.resolve(c.dataDir, prefix);
      const srcDir = path.resolve(c.srcDir, prefix);
      return {
        ...c,
        dataDir,
        cacheDir,
        srcDir,
        cache: (url: string) => cache(cacheDir, url),
        writeData: (file: string, content: string) => write(dataDir, file, content),
        writeSrc: (file: string, content: string) => write(srcDir, file, content),
      };
    });
  }
  return (
    _root ||
    Promise.resolve().then(async () => {
      const pkgDir = await getPackageRootDir();
      const dataDir = path.resolve(pkgDir, 'data');
      const cacheDir = path.resolve(pkgDir, 'cache');
      const srcDir = path.resolve(pkgDir, 'src');
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.mkdir(dataDir, { recursive: true });
      return (_root = Object.freeze({
        pkgDir,
        dataDir,
        cacheDir,
        srcDir,
        rootCacheDir: cacheDir,
        rootDataDir: dataDir,
        cache: (url: string) => cache(cacheDir, url),
        writeData: (file: string, content: string) => write(dataDir, file, content),
        writeSrc: (file: string, content: string) => write(srcDir, file, content),
      }));
    })
  );
}

async function write(dir: string, file: string, content: string) {
  const size = new Blob([content]).size;
  const dst = path.join(dir, file);
  let last;
  try {
    last = (await fs.stat(dst)).size;
  } catch {}
  console.info(
    `[write] ${path.relative(_root.pkgDir, dir)} ${file} ${
      last ? (last !== size ? `${formatBytes(last)} (${last}) -> ` : 'SAME SIZE ') : ''
    }${formatBytes(size)} (${size})`,
  );
  await fs.writeFile(dst, content);
}
