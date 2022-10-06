import { MaybePromise } from '@wener/utils';

export interface UnpkgStorage<O extends object = any> {
  init(o?: O): Promise<void>;

  saveRawFile(o: RawFileEntity): MaybePromise<void>;

  getRawFileDataByUrl(url: string): MaybePromise<BufferSource | undefined>;

  savePackageFile(o: PackageFileEntity): MaybePromise<void>;

  hasPackageFile(pkg: string): MaybePromise<boolean>;

  getPackageFileDataByPackageAndPath(o: { package: string; path: string }): MaybePromise<BufferSource | undefined>;

  getPackageMetaByNameAndVersion(param: { name: string; version: string }): MaybePromise<any>;

  savePackage(param: PackageEntity): MaybePromise<void>;
}

export interface RawFileEntity {
  url: string;
  name: string;
  version: string;
  data: BufferSource;
}

export interface PackageFileEntity {
  package: string;
  path: string;
  size: number;
  data: BufferSource;
}

export interface PackageEntity {
  name: string;
  version: string;
  meta: string;
}
