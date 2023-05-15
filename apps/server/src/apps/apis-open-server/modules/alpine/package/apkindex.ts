import { Readable } from 'node:stream';
import tar from 'tar';

const IndexEntry: Record<string, { name: string; parse?: (v: string) => any }> = {
  C: { name: 'checksum' },
  P: { name: 'name' },
  V: { name: 'version' },
  A: { name: 'arch' },
  S: { name: 'size', parse: (v: string) => parseInt(v, 10) },
  I: { name: 'installSize', parse: (v: string) => parseInt(v, 10) },
  T: { name: 'description' },
  U: { name: 'url' },
  L: { name: 'license' },
  o: { name: 'origin' },
  m: { name: 'maintainer' },
  t: { name: 'buildTime', parse: (v: string) => new Date(parseInt(v, 10) * 1000) },
  c: { name: 'commit' },
  D: { name: 'depends', parse: (v: string) => v.split(' ') },
  p: { name: 'provides', parse: (v: string) => v.split(' ') },
  i: { name: 'installIf', parse: (v: string) => v.split(' ') },
  k: { name: 'providerPriority', parse: (v: string) => parseInt(v, 10) },
};

export interface ApkIndexPackageEntry {
  name: string;
  version: string;
  arch: string;
  url: string;
  license: string;
  description: string;
  size: number;
  installSize: number;
  origin: string;
  maintainer: string;
  depends?: string[];
  provides?: string[];
  installIf?: string[];
  buildTime: Date;
  commit: string;
  checksum: string;
  providerPriority?: number;
}

export function parseApkIndexContent(content: string) {
  // // order based on apk-tools apk_pkg_write_index_entry
  // https://wiki.alpinelinux.org/wiki/Apk_spec
  const packageInfoLines = content.split('\n');
  const packages: ApkIndexPackageEntry[] = [];

  let cur: Record<string, any> = {};
  for (const line of packageInfoLines) {
    const idx = line.indexOf(':');
    const key = line.slice(0, idx);
    const value = line.slice(idx + 1).trim();
    if (!line) {
      if (Object.keys(cur).length > 0) {
        packages.push(cur as any);
        cur = {};
      }
      continue;
    }

    const entry = IndexEntry[key as keyof typeof IndexEntry];
    if (!entry) {
      throw new Error(`Unknown entry: ${key} in line "${line}"`);
    }
    cur[entry.name] = entry.parse?.(value) ?? value;
  }
  return packages;
}

export function parseApkIndexArchive(rs: Readable) {
  let apkIndexContent = '';
  return new Promise<{ content: string }>((resolve, reject) => {
    rs.pipe(tar.t())
      .on('entry', (entry) => {
        if (entry.path === 'APKINDEX') {
          entry.on('data', (data) => {
            apkIndexContent += data.toString();
          });
        }
      })
      .on('end', () => resolve({ content: apkIndexContent }))
      .on('error' as any, () => reject());
  });
}

export function parseChecksum(s: string): { type: 'none' | 'sha1' | 'md5'; sum?: Uint8Array } {
  const c: { type: 'none' | 'sha1' | 'md5'; sum?: Uint8Array } = {
    type: 'none',
  };

  if (s === '') {
    return c;
  }

  if (s.length < 2) {
    throw new Error(`ParseChecksum: invalid checksum size ${s.length}`);
  }

  const enc = s[0];
  const typ = s[1];

  switch (enc) {
    case 'X':
      c.sum = new Uint8Array(
        s
          .slice(2)
          .match(/.{1,2}/g)!
          .map((byte) => parseInt(byte, 16)),
      );
      break;
    case 'Q':
      c.sum = new Uint8Array(
        atob(s.slice(2))
          .split('')
          .map((c) => c.charCodeAt(0)),
      );
      break;
  }

  switch (typ) {
    case '1':
      c.type = 'sha1';
      break;
    default:
      c.type = 'md5';
      break;
  }

  return c;
}
