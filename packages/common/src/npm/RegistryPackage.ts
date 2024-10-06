import type { PackageJson } from './PackageJson';

/**
 * @see https://registry.npmjs.org/@wener/reaction
 */
export interface RegistryPackage {
  _id: string;
  _rev: string;
  name: string;
  'dist-tags': Record<string, string>;
  versions: Record<string, RegistryPackageJson>;
  time: {
    created: string;
    modified: string;
    [key: string]: string;
  };
  readme?: string;
  readmeFilename?: string;
  description: string;
  homepage: string;
  keywords: string[];
  maintainers: Array<{ name: string; email: string }>;
  repository?: {
    type: string;
    url: string;
    directory?: string;
  };
  bugs?: {
    email?: string;
    url: string;
  };
  license: string;
}

export interface RegistryPackageJson extends PackageJson {
  _id: string;
  _integrity: string;
  _resolved: string;
  _from: string;
  _nodeVersion: string;
  _npmVersion: string;
  _npmUser: {
    name: string;
    email: string;
  };
  _npmOperationalInternal?: {
    host: string;
    tmp: string;
  };
  _hasShrinkwrap?: boolean;
  gitHead?: string;
  dist: {
    integrity: string;
    shasum: string;
    tarball: string;
    fileCount: number;
    unpackedSize: number;
    signatures?: {
      keyid: string;
      sig: string;
    }[];
    'npm-signature'?: string;
  };
}
