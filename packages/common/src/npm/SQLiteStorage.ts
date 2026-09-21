import { DatabaseSync } from 'node:sqlite';
import type { PackageEntity, PackageFileEntity, RawFileEntity, UnpkgStorage } from './UnpkgStorage';

export interface SQLiteStorageOptions {
	database?: string;
	cache?: DatabaseSync;
}

function toSQLiteBlob(data: BufferSource) {
	if (data instanceof ArrayBuffer) {
		return Buffer.from(data);
	}

	return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
}

export class SQLiteStorage implements UnpkgStorage<SQLiteStorageOptions> {
	cache: DatabaseSync = undefined as any;
	private readonly options: SQLiteStorageOptions = {};

	constructor(options: SQLiteStorageOptions = {}) {
		this.options = options;
	}

	init(o: SQLiteStorageOptions = {}): Promise<void> {
		Object.assign(this.options, o);
		let cache = this.options.cache;
		const { database } = this.options;
		if (!cache) {
			const db = (cache = new DatabaseSync(database || 'unpkg.db', { allowBareNamedParameters: true }));
			cache.exec('PRAGMA journal_mode = WAL');
			cache.exec('PRAGMA synchronous = OFF');
			SQLiteSchemas.forEach((v) => db.exec(v));
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
			.run({ ...o, data: toSQLiteBlob(o.data) });
	}

	getRawFileDataByUrl(url: string) {
		return (
			this.cache
				.prepare(
					`select data
         from tars
         where url = ?`,
				)
				.get(url) as { data: BufferSource } | undefined
		)?.data;
	}

	getPackageFileDataByPackageAndPath(o: { package: string; path: string }) {
		return (
			this.cache
				.prepare(
					`select data
         from files
         where package = $package
           and path = $path`,
				)
				.get(o) as { data: BufferSource } | undefined
		)?.data;
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
			.run({ ...o, data: toSQLiteBlob(o.data) });
	}

	getPackageMetaByNameAndVersion(param: { name: string; version: string }) {
		return (
			this.cache
				.prepare(
					`select meta
         from packages
         where name = $name
           and version = $version`,
				)
				.get(param) as { meta: string } | undefined
		)?.meta;
	}

	savePackage(param: PackageEntity) {
		this.cache
			.prepare(
				`INSERT OR IGNORE INTO packages (name, version, meta)
         VALUES ($name, $version, $meta)`,
			)
			.run({ name: param.name, version: param.version, meta: param.meta });
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
