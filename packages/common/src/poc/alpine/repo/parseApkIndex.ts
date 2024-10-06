import { PackageIndexEntry } from '@/poc/alpine/repo/types';

const Short2Long: Record<string, keyof PackageIndexEntry> = {
  C: 'checksum',
  P: 'pkg',
  V: 'version',
  A: 'arch',
  S: 'size',
  I: 'installSize',
  T: 'description',
  U: 'url',
  L: 'license',
  m: 'maintainer',
  o: 'origin',
  t: 'buildTime',
  c: 'commit',
  k: 'providerPriority',
  D: 'depends',
  p: 'provides',
  i: 'installIf',
};

export function parseApkIndex(txt: string) {
  const out: PackageIndexEntry[] = [];

  const create = (): Partial<PackageIndexEntry> => {
    return {
      depends: [],
      provides: [],
      installIf: [],
    };
  };

  let build = create();
  for (let line of txt.split('\n')) {
    if (!line) {
      build.pkg && out.push(build as any as PackageIndexEntry);
      build = create();
      continue;
    }
    let k = line.charAt(0);
    let v: any = line.slice(2);
    let f = Short2Long[k];
    if (!f) {
      throw new Error(`unknown field ${line.charAt(0)} in ${line}`);
    }
    switch (f) {
      case 'size':
      case 'installSize':
      case 'providerPriority':
      case 'buildTime':
        v = parseInt(v);
        break;
      case 'depends':
      case 'provides':
      case 'installIf':
        v = v.split(' ');
        break;
    }
    build[f] = v;
  }
  if (build.pkg) {
    out.push(build as any as PackageIndexEntry);
  }
  return out;
}
