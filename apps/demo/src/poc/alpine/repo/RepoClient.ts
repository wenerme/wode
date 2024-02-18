import { FetchLike } from '@wener/utils';
import YAML from 'yaml';

interface RepoClientOptions {
  url: string;
  branch: string;
  repo: string;
  arch: string;
  fetch: FetchLike;
}

export class RepoClient {
  readonly options: RepoClientOptions;

  constructor({
    url = 'https://mirrors.sjtug.sjtu.edu.cn/alpine/',
    branch = 'edge',
    repo = 'main',
    arch = 'x86_64',
    fetch = globalThis.fetch,
  }: Partial<RepoClientOptions> = {}) {
    this.options = { url, branch, repo, arch, fetch };
  }

  with(o: { url?: string; branch?: string; repo?: string; arch?: string }) {
    return new RepoClient({ ...this, ...o });
  }

  private async request(o: { path: string } | string) {
    const opts = typeof o === 'string' ? { path: o } : o;
    const { path } = opts;
    const { fetch, url } = this.options;
    let u = `${url}/${path}`;
    return await fetch(u).then((res) => {
      if (!res.ok) {
        throw Object.assign(new Error(`failed to fetch: ${res.status} ${res.statusText}`), { url: u, res });
      }
      return res;
    });
  }

  async getMirrors() {
    const s = await this.request(`MIRRORS.txt`)
      .then(requireResponseOk)
      .then((res) => res.text());
    return s.split('\n').filter(Boolean);
  }

  async getFasterMirror() {
    const { fetch } = this.options;
    const mirrors = await this.getMirrors();
    const ac = new AbortController();
    return Promise.any(
      mirrors.map((v) =>
        fetch(`${v}/last-updated`.replace(/\/{2,}/, '/'), { signal: ac.signal })
          .then((res) => res.text())
          .then(() => {
            ac.abort();
            return v;
          }),
      ),
    );
  }

  async getLastUpdated() {
    const s = await this.request(`last-updated`).then((res) => res.text());
    return new Date(parseInt(s) * 1000);
  }

  async getLatestReleases({ arch = this.options.arch }: { arch?: string } = {}) {
    const s = await this.request(`latest-stable/releases/${arch}/latest-releases.yaml`).then((res) => res.text());
    return YAML.parse(s) as LatestReleaseEntry[];
  }

  async getLatestRelease({ arch = this.options.arch }: { arch?: string } = {}) {
    // also https://alpinelinux.org/releases.json
    const [release] = await this.getLatestReleases({ arch });
    const { branch, version } = release;
    return { branch, version };
  }

  buildPackageUrl({
    pkg,
    ver,
    ...opts
  }: {
    pkg: string;
    ver: string;
  } & Partial<RepoClientOptions>) {
    return `${this.buildPackageBaseUrl(opts)}/${pkg}-${ver}.apk`;
  }

  buildPackageBaseUrl(opts: Partial<RepoClientOptions> = {}) {
    const { branch, repo, arch, url } = { ...this.options, ...opts };
    return `${url}/${branch}/${repo}/${arch}/`;
  }

  buildPackageIndexUrl(opts: Partial<RepoClientOptions> = {}) {
    return `${this.buildPackageBaseUrl(opts)}/APKINDEX.tar.gz`;
  }
}

export interface LatestReleaseEntry {
  title: string;
  desc: string;
  branch: string; // v3.19
  arch: string; // x86_64
  version: string; // 3.19.1
  flavor: string; // alpine-minirootfs
  file: string;
  iso: string;
  date: string; // 2024-01-26
  time: string; // 17:53:05
  size: number;
  sha256: string;
  sha512: string;
}

function requireResponseOk(res: Response) {
  if (!res.ok) {
    throw new Error(`failed to fetch: ${res.status} ${res.statusText}`);
  }
  return res;
}
