import { defineEntity, type DefineEntityOptions } from '@wener/nestjs/entity';
import type { Constructor } from '@wener/utils';
import _ from 'lodash';
import { createMetadataKey, defineMetadata } from '@/utils/meta/defineMetadata';

type DefineSystemModuleOptions = {
  name: string;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
  entities?: Constructor[];

  onLoad?: (mod: SystemModuleDef) => void;
};
type SystemModuleDef = {
  name: string;
  title: string;
  description?: string;
  metadata: Record<string, any>;
  entities: Constructor[];
};

let defs: SystemModuleDef[] = [];

export function defineSystemModule(opts: DefineSystemModuleOptions) {
  const def: SystemModuleDef = {
    title: _.startCase(opts.name),
    metadata: {},
    entities: [],
    ...opts,
  };

  defs.push(def);
  // do not delay
  if (opts.onLoad) {
    opts.onLoad(def);
  }

  return def;
}

export function getSystemModules(): SystemModuleDef[] {
  return defs;
}

export function defineSystemModuleEntity(mod: SystemModuleDef, opts: DefineEntityOptions[]) {
  return defineEntity(opts).map((v) => {
    defineMetadata(v, SystemModuleNameMetaKey, mod.name);
    mod.entities.push(v.Entity as Constructor);
    return v;
  });
}

const SystemModuleNameMetaKey = createMetadataKey('SystemModuleName');
