import fs from 'fs-extra';
import path from 'node:path';
import { getPackageDir } from './getPackageDir';

export function getStaticRootPath() {
  let s = process.env.STATIC_ROOT_PATH;
  if (!s) {
    if (fs.existsSync('public')) {
      s = path.resolve('public');
    }
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
