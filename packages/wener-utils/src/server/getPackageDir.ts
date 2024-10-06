import fs from 'node:fs';
import path from 'node:path';

// import { fileURLToPath } from 'node:url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

export function getPackageDir(currentDir: string = process.cwd()) {
  while (!fs.existsSync(path.join(currentDir, 'package.json'))) {
    currentDir = path.resolve(currentDir, '..');
    if (currentDir === '/') {
      return undefined;
    }
  }
  return currentDir;
}

function findUp() {}
