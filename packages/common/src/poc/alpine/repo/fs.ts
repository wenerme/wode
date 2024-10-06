import path from 'node:path';

export function getAlpineCacheDir(...paths: string[]) {
  let dir = '/tmp/cache/alpine';
  if (paths.length) {
    path.join(dir, ...paths);
  }
  return dir;
}
