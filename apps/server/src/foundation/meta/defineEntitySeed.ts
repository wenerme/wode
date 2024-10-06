import type { EntityClass, RequiredEntityData } from '@mikro-orm/core';

export interface DefineEntitySeedOptions<T, B extends Partial<T> = {}> {
  name?: string;
  title?: string;
  description?: string;
  Entity: EntityClass<T>;
  base?: B;
  data: Array<Omit<RequiredEntityData<T>, keyof B> & Partial<Pick<B, keyof B & string>>>;
  onConflict?: {
    fields?: string[];
    action?: 'ignore' | 'merge';
    merge?: string[];
    exclude?: string[];
  };
  metadata?: Record<string, any>;
}

export interface EntitySeedDef {
  name: string;
  title: string;
  description?: string;
  Entity: EntityClass<any>;
  data: Array<Record<string, any>>;
  onConflict: {
    fields?: string[];
    action?: 'ignore' | 'merge';
    merge?: string[];
    exclude?: string[];
  };
  metadata: Record<string, any>;
}

let _seeds: EntitySeedDef[] = [];

export function defineEntitySeed<T, B extends Partial<T>>(opts: DefineEntitySeedOptions<T, B>) {
  let index = _seeds.filter((v) => v.Entity === opts.Entity).length;
  const name = opts.name || `${opts.Entity.name}Seed${index}`;
  const def: EntitySeedDef = {
    name,
    title: opts.title || name,
    Entity: opts.Entity,
    data: opts.data.map((v) => {
      return Object.assign({}, opts.base, v);
    }),
    onConflict: opts.onConflict || {
      fields: [],
      action: 'ignore',
      merge: [],
      exclude: [],
    },
    metadata: {
      ...opts.metadata,
    },
  };
  _seeds.push(def);
}

export function getEntitySeedDefs() {
  return _seeds;
}
