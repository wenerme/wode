import fs from 'node:fs/promises';
import path from 'node:path';
import type { MaybePromise } from '../asyncs/MaybePromise';
import { Errors } from '../errors/Errors';
import { getPackageDir } from '../server';
import { formatBytes } from '../strings/formatBytes';

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

async function cache(dir: string, url: string): Promise<string> {
  const key = path.basename(url);
  await fs.mkdir(path.join(dir), { recursive: true });
  const file = path.join(dir, key);
  try {
    await fs.stat(file);
    console.info('[cache] hit', url);
    return await fs.readFile(file, 'utf-8');
  } catch (e) {}
  console.info('[cache] miss', url);
  const text = await fetch(url).then((v) => {
    if (v.status >= 300) {
      throw new Error(`[cache] fetch ${url} ${v.status} ${v.statusText}`);
    }
    return v.text();
  });
  const size = new Blob([text]).size;
  console.info(`[cache] write ${file} ${formatBytes(size)} (${size})`);
  await fs.writeFile(file, text);
  return text;
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
      const pkgDir = await getPackageDir();
      Errors.BadRequest.check(pkgDir, 'pkgDir not found');
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
