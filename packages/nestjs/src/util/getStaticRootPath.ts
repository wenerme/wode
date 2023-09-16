import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { getPackageDir } from '@wener/utils/server';

export function getStaticRootPath() {
  let s = process.env.STATIC_ROOT_PATH;
  if (!s && fs.existsSync('public')) {
    s = path.resolve('public');
  }

  if (!s) {
    const packageDir = getPackageDir();
    if (packageDir) {
      s = path.join(packageDir, 'public');
    }
  }

  if (!s) {
    console.error('no static root path');
    s = '/app/public';
  }

  return s;
}
