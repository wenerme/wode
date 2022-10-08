import { PackageJson } from './PackageJson';

/**
 * @see https://registry.npmjs.org/@wener/reaction
 */
export interface PackageRegistryEntry {
  _id: string;
  _rev: string;
  name: string;
  'dist-tags': Record<string, string>;
  versions: Record<string, PackageJson>;
  time: Record<string, string>;
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
