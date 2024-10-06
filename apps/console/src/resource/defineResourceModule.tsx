import type { ResourceSchemaDef } from '@/resource/defineResource';

type DefineResourceModuleOptions = {
  name: string;
  title: string;
  resources: ResourceSchemaDef[];
  metadata?: Record<string, any>;
};

/**
 * @experimental
 */
export function defineResourceModule(opts: DefineResourceModuleOptions) {
  return opts;
}
