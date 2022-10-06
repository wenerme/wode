import SQLite, { type Database } from 'better-sqlite3';
import { PackageEntity, PackageFileEntity, RawFileEntity, UnpkgStorage } from './UnpkgStorage';

export interface SQLiteStorageOptions {
  database?: string;
  cache?: Database;
}

export class SQLiteStorage implements UnpkgStorage<SQLiteStorageOptions> {
  cache: Database = undefined as any;
  private options: SQLiteStorageOptions = {};

  constructor(options: SQLiteStorageOptions = {}) {
    this.options = options;
  }

  init(o: SQLiteStorageOptions = {}): Promise<void> {
    Object.assign(this.options, o);
    let cache = (this.cache = this.options.cache!);
    const { database } = this.options;
    if (!cache) {
      cache = new SQLite(database || 'unpkg.db', {});
      cache.pragma('journal_mode = WAL');
      cache.pragma('synchronous = OFF');
      SQLiteSchemas.forEach((v) => cache.exec(v));
    }
    this.cache = cache;
    return Promise.resolve(undefined);
  }

  saveRawFile(o: RawFileEntity) {
    this.cache
      .prepare(
        `INSERT OR IGNORE INTO tars (url, name, version, data)
         VALUES ($url, $name, $version, $data)`,
      )
      .run(o);
  }

  getRawFileDataByUrl(url: string) {
    return this.cache
      .prepare(
        `select data
         from tars
         where url = ?`,
      )
      .get(url)?.data;
  }

  getPackageFileDataByPackageAndPath(o: { package: string; path: string }) {
    return this.cache
      .prepare(
        `select data
         from files
         where package = $package
           and path = $path`,
      )
      .get(o)?.data;
  }

  hasPackageFile(pkg: string) {
    return Boolean(
      this.cache
        .prepare(
          `select 1
           from files
           where package = ?
           limit 1`,
        )
        .get(pkg),
    );
  }

  savePackageFile(o: PackageFileEntity) {
    this.cache
      .prepare(
        `INSERT OR IGNORE INTO files (package, path, size, data)
         VALUES ($package, $path, $size, $data)`,
      )
      .run(o);
  }

  getPackageMetaByNameAndVersion(param: { name: string; version: string }) {
    return this.cache
      .prepare(
        `select meta
         from packages
         where name = $name
           and version = $version`,
      )
      .get(param)?.meta;
  }

  savePackage(param: PackageEntity) {
    this.cache
      .prepare(
        `INSERT OR IGNORE INTO packages (name, version, meta)
         VALUES ($name, $version, $meta)`,
      )
      .run(param);
  }
}

const SQLiteSchemas = [
  `
    CREATE TABLE IF NOT EXISTS tars
    (
      url     text primary key,
      name    text,
      version text,
      data    blob,
      unique (name, version)
    )
  `,
  `CREATE TABLE IF NOT EXISTS packages
   (
     name    text,
     version text,
     meta    json,
     primary key (name, version)
   )
  `,
  `
    CREATE TABLE IF NOT EXISTS files
    (
      package text,
      path    text,
      size    int,
      data    blob,
      primary key (package, path)
    )
  `,
];
