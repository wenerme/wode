import LRU from 'lru-cache';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import zlib from 'node:zlib';
import semver from 'semver';
import tar, { type ReadEntry } from 'tar';
import { createLazyPromise, Logger, parseModuleId } from '@wener/utils';
import { RegistryPackage, RegistryPackageJson } from './RegistryPackage';
import { UnpkgStorage } from './UnpkgStorage';

export interface InitUnpkgOptions {
  url?: string;
  storage: UnpkgStorage;
  logger?: Logger;
  tmp?: string;
  fetch?: SimpleFetch;
  lru?: LRU<string, any>;
}

interface UnpkgOptions {
  url: string;
  storage: UnpkgStorage;
  logger: Logger;
  tmp: string;
  fetch: SimpleFetch;
  lru: LRU<string, any>;
}

export type SimpleFetch = (url: string, init?: RequestInit) => Promise<Response>;

export class Unpkg {
  url: string;
  fetch: SimpleFetch;
  readonly storage: UnpkgStorage;
  protected log;
  // pkg -> package list meta
  // pkg@version -> package meta
  protected tmp;
  // pkg@version/path -> file
  protected lru: LRU<string, any>;
  private readonly options: UnpkgOptions;

  constructor(options: InitUnpkgOptions) {
    const { url, logger, tmp, lru, storage } = (this.options = Object.assign(
      {
        logger: console,
        url: 'https://registry.npmjs.org',
        tmp: '/tmp/unpkg',
        fetch: globalThis.fetch,
        lru: new LRU({ max: 1000, ttl: 1000 * 60 * 5 }), // 5 min
      },
      options,
    ));

    this.url = url;
    this.log = logger;
    this.tmp = tmp;
    this.fetch = fetch;
    this.lru = lru;
    this.storage = storage;
  }

  async init() {
    await fs.mkdir(this.options.tmp, { recursive: true });
    await this.storage.init();
  }

  async getPackageFile(packageName: string): Promise<Buffer> {
    const { storage, log } = this;
    const info = await this.getPackageVersionInfo(packageName);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { path: requestFilePath } = parseModuleId(packageName)!;
    // resolve path?
    if (!requestFilePath) {
      throw new Error(`Missing path: ${packageName}`);
    }
    const pkgId = info._id;
    if (!(await storage.hasPackageFile(pkgId))) {
      log.info(`getPackageFile: untar ${pkgId}`);
      const buffer = await this.getPackageTarball(packageName);
      const readable = Readable.from(buffer);

      const read = createLazyPromise();
      readable
        .pipe(zlib.createUnzip())
        .pipe(tar.t())
        .on('error' as any, read.reject)
        .on('close', () => {
          log.info('Tar: close');
          read.resolve();
        })
        .on('entry', async (entry: ReadEntry) => {
          if (entry.meta) {
            return;
          }
          const buf = Buffer.concat(await entry.collect());

          let p = entry.path;
          p = p.substring(p.indexOf('/'));
          log.info(`Tar: ${entry.type} -  ${p} - ${entry.size} - ${path.extname(p)} `);
          await storage.savePackageFile({
            package: pkgId,
            size: entry.size ?? 0,
            path: p,
            data: buf,
          });
        });
      await read;
    }

    const data = (await storage.getPackageFileDataByPackageAndPath({
      package: pkgId,
      path: requestFilePath,
    })) as Buffer;
    if (!data) {
      log.warn(`getPackageFile: ${pkgId} ${requestFilePath} not found`);
      throw Object.assign(new Error(`File not found: ${requestFilePath}`), { status: 404 });
    }
    return data;
  }

  async getPackageTarballPath(packageName: string): Promise<string> {
    const info = await this.getPackageVersionInfo(packageName);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { name, version = info.version, pkg } = parseModuleId(packageName)!;
    const dir = `${this.tmp}/${name}`;
    await fs.mkdir(dir);

    const metaPath = `${dir}/${pkg}-${version}.json`;
    if (!(await fs.stat(metaPath))) {
      await fs.writeFile(metaPath, JSON.stringify(info, null, 2));
    }

    const tgzPath = `${dir}/${pkg}-${version}.tgz`;
    if (!(await fs.stat(tgzPath))) {
      const buffer = await this.getPackageTarball(packageName);
      await fs.writeFile(tgzPath, buffer);
    }

    return tgzPath;
  }

  async getPackageTarball(packageName: string): Promise<Buffer> {
    const info = await this.getPackageVersionInfo(packageName);
    if (!info) {
      throw new Error(`Invalid package name: ${packageName}`);
    }
    const { name, version } = info;
    const { storage, fetch } = this;
    const url = info.dist.tarball;
    let data = (await storage.getRawFileDataByUrl(url)) as Buffer;
    if (data) {
      return data;
    }
    this.log.info(`getPackageTarball fetch ${packageName} -> ${url}`);
    data = Buffer.from(await fetch(url).then((v) => v.arrayBuffer()));
    await storage.saveRawFile({ url, name, version, data });
    return data;
  }

  /**
   * will resolve to matched version
   * @param packageName @org/name@version
   */
  async getPackageInfo(packageName: string): Promise<RegistryPackage> {
    const module = parseModuleId(packageName);
    if (!module) {
      throw Object.assign(new Error(`Invalid package name: ${packageName}`), { status: 400 });
    }
    const { fetch, log, lru } = this;
    const { name } = module;
    const dir = `${this.tmp}/${name}`;
    const metaPath = `${dir}/package.json`;

    let out = lru.get(name);
    if (out) {
      // expire?
      return out;
    }
    try {
      const mtime = (await fs.stat(metaPath))?.mtime;
      // 15min
      if (mtime) {
        if (Date.now() - mtime.getTime() < 1000 * 60 * 60 * 15) {
          out = JSON.parse((await fs.readFile(metaPath)).toString());
          lru.set(name, out);
          return out;
        } else {
          log.info(`getPackageInfo: expired ${packageName}`);
        }
      }
    } catch (e) {
      // file not exists
    }

    const url = `${this.url}/${name}`;
    log.info(`getPackageInfo: fetch ${packageName} -> ${url}`);
    out = await fetch(url).then((v) => v.json());
    if (!out?._id) {
      throw new Error(`Invalid package ${packageName} metadata: missing _id`);
    }
    await fs.mkdir(dir, { recursive: true });
    lru.set(name, out);
    await fs.writeFile(metaPath, JSON.stringify(out, null, 2));
    return out;
  }

  /**
   * will resolve to matched version
   */
  async getPackageVersionInfo(packageName: string): Promise<RegistryPackageJson> {
    const module = parseModuleId(packageName);
    if (!module) {
      throw Object.assign(new Error(`Invalid package name: ${packageName}`), { status: 400 });
    }
    const { storage, log, fetch, lru } = this;
    log.trace(`getPackageInfo: ${packageName}`);
    let { id, name, version, range } = module;
    let out: RegistryPackageJson;

    // always fetch latest
    if (range !== 'latest') {
      if (!version) {
        const all = await this.getPackageInfo(packageName);
        const versions = Object.keys(all.versions);
        version =
          all['dist-tags']?.[range] || versions.includes(range) ? range : semver.maxSatisfying(versions, range) || '';
        if (!version) {
          throw Object.assign(new Error(`unable to resolve ${id}`), { status: 404 });
        }

        id = `${name}@${version}`;
      }

      out = lru.get(id) as RegistryPackageJson;
      if (out) {
        return out;
      }

      const meta = await storage.getPackageMetaByNameAndVersion({ name, version });
      if (meta) {
        out = JSON.parse(meta);
        lru.set(id, out);
        return out;
      }
    }

    //
    const url = `${this.url}/${name}/${version || 'latest'}`;
    out = await fetch(url).then((v) => v.json());
    version = out.version;
    log.info(`getPackageVersionInfo: fetch ${packageName} -> ${url}`);
    if (!out?.name) {
      log.warn(`getPackageVersionInfo: not found ${packageName} -> ${url}`);
      throw Object.assign(new Error(`unable to fetch ${id}`), { status: 404 });
    }
    await storage.savePackage({
      name,
      version,
      meta: JSON.stringify(out),
    });

    lru.set(id, out);
    return out;
  }
}
