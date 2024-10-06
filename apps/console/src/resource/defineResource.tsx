import React, { type ReactElement } from 'react';
import { PiUsersLight } from 'react-icons/pi';
import { kebabCase, startCase } from 'es-toolkit';
import type { AnyResource } from './types/AnyResource';

export interface DefineResourceOptions<T = AnyResource> {
  name: string;
  idType?: string;
  typeName?: string;
  slug?: string;
  title?: string;
  icon?: ReactElement;
  metadata?: Record<string, any>;
  extend?: ResourceSchemaDef;
  features?: string[];
  // helper function to make init stuff stick with options
  onLoad?: (def: ResourceSchemaDef<T>) => void;
}

export interface ResourceSchemaDef<T = AnyResource> {
  name: string;
  idType: string;
  typeName: string;
  slug: string;
  title: string;
  icon: ReactElement;
  metadata: Record<string, any>;
  extend?: ResourceSchemaDef;
  features: string[];
}

const _all: ResourceSchemaDef[] = [];
const _index: Record<string, ResourceSchemaDef> = {};

export function defineResource<T = AnyResource>({ onLoad, ...opts }: DefineResourceOptions<T>) {
  const {
    extend,
    name,
    title = extend?.title || startCase(name),
    typeName = extend?.typeName || name,
    slug = kebabCase(name),
    idType = extend?.idType || typeName.toLowerCase(),
    icon = extend?.icon || <PiUsersLight />,
  } = opts;
  const def: ResourceSchemaDef = {
    features: [],
    ...extend,
    idType,
    extend,
    ...opts,
    // query: {
    //   filters: (extend?.query?.filters || []).concat(opts.query?.filters || []),
    // },
    metadata: {
      ...extend?.metadata,
      ...opts.metadata,
    },
    title,
    typeName,
    slug,
    icon,
  };
  {
    const last = _index[def.name];
    if (last) {
      console.warn(`override resource schema ${def.name}`);
      _all.splice(_all.indexOf(last), 1);
      delete _index[last.name];
      delete _index[last.idType];
      delete _index[last.typeName];
    }
  }
  // unique
  _index[def.name] = def;
  _all.push(def);
  // index
  _index[def.idType] ||= def;
  _index[def.typeName] ||= def;

  if (onLoad) {
    // avoid use ref before init
    void Promise.resolve().then(() => onLoad(def));
  }

  return def;
}

export interface ResolveResourceSchemaOptions {
  id?: string;
  name?: string;
  typeName?: string;
  __typename?: string;
}

export function resolveResourceSchema(opts?: ResolveResourceSchemaOptions): ResourceSchemaDef | undefined {
  if (!opts) return undefined;
  const { id, name, typeName, __typename } = opts;
  if (id) {
    const [type] = id.split('_');
    return _index[type];
  }
  return _index[name || typeName || __typename || ''];
}

export function getResourceSchemas() {
  return _all;
}

export function isResource<T = AnyResource>(schema: ResourceSchemaDef<T>, data: any): data is T {
  if (data && 'id' in data) {
    const idType = schema.idType;
    return data.id.startsWith(`${idType}_`);
  }
  return false;
}
