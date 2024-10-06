export type AlpineArch = 'x86' | 'x86_64' | 'armhf' | 'armv7' | 'aarch64' | 'ppc64le' | 's390x' | 'riscv64';

/**
 * @see https://wiki.alpinelinux.org/wiki/Apk_spec
 */
export interface PackageIndexEntry {
  checksum: string;
  pkg: string;
  version: string;
  description: string;
  arch: string;
  size: number;
  installSize: number;
  maintainer: string;
  origin: string;
  buildTime: number;
  commit: string;
  license: string;
  providerPriority: number;
  url: string;
  depends: string[];
  provides: string[];
  installIf: string[];

  // branch: string;
  // repo: string;
  // arch: string;
  // name: string;
  // version: string;
  // size: number;
  // installSize: number;
  // description: string;
  // url: string;
  // license: string;
  // maintainer: string;
  // origin: string;
  // buildTime: string;
  // commit: string;

  // maintainerName: string;
  // maintainerEmail: string;
  // path: string;
  // key: string;

  // commitData: Commit;
  // dependPackages: PackageIndexEntry[];
}
