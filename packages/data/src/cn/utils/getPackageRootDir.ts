import fs from 'fs-extra';
import { resolve } from 'import-meta-resolve';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const resolve = import.meta.resolve!.bind(import.meta);

export function getPackageRootDirFrom(currentDir: string = __dirname) {
  while (!fs.existsSync(path.join(currentDir, 'package.json'))) {
    currentDir = path.resolve(currentDir, '..');
    if (currentDir === '/') {
      return undefined;
    }
  }
  return currentDir;
}

export async function getPackageRootDir(pkg?: string, rel?: string) {
  let r;
  if (!pkg) {
    r = getPackageRootDirFrom();
  } else {
    r = getPackageRootDirFrom(fileURLToPath(await resolve(pkg, import.meta.url)));
  }
  if (!r) {
    throw new Error(`Cannot find package root dir ${pkg || ''}`);
  }
  if (rel) {
    r = path.resolve(r, rel);
  }
  return r;
}
