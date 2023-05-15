export class Mirror {
  url = 'https://mirrors.tuna.tsinghua.edu.cn/alpine/';

  getRepoIndexUrl({ release, repo, arch }: RepoCoordinate) {
    return `${this.url}/${release}/${repo}/${arch}/APKINDEX.tar.gz`;
  }
}

export class DiskMirror {
  constructor(public root: string) {}

  getRepoIndexUrl({ release, repo, arch }: RepoCoordinate) {
    return `${this.root}/${release}/${repo}/${arch}/APKINDEX.tar.gz`;
  }
}

export interface RepoCoordinate {
  release: string | 'edge' | 'v3.17';
  repo: string;
  arch: string;
}

export interface PkgCoordinate extends RepoCoordinate {
  pkg: string;
  ver: string;
}

const Arch = ['x86_64', 'x86', 'aarch64', 'armhf', 'ppc64le', 's390x', 'armv7', 'riscv64'];
const Repo = ['main', 'community', 'testing'];
