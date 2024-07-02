import { BaseEntity, EntityClass, MetadataStorage } from '@mikro-orm/core';
import { Features } from '../Feature';
import { getTypeOfEntityTypeId } from './parseEntityTypeId';

export interface DefineEntityOptions {
  Entity: EntityClass<any>;
  idType?: string;
  tableName?: string;
  typeName?: string;
  schema?: string;
  title?: string;
  metadata?: Record<string, any>;
  features?: string[];
}

export interface EntityDef {
  Entity: EntityClass<any>;
  idType?: string;
  typeName: string;
  title: string;
  metadata: Record<string, any>;
  tableName?: string;
  schema?: string;
  features: string[];
}

let _index = new Map<EntityClass<any> | string, EntityDef>();
let _resource = new Map<EntityClass<any>, EntityDef>();

export function defineEntity(o: DefineEntityOptions): EntityDef;
export function defineEntity(o: DefineEntityOptions[]): EntityDef[];
export function defineEntity(o: DefineEntityOptions | DefineEntityOptions[]) {
  if (Array.isArray(o)) {
    return o.map((v) => defineEntity(v));
  }
  let def = o as EntityDef;
  let meta = MetadataStorage.getMetadataFromDecorator(o.Entity);

  def.metadata ||= {};
  def.tableName ||= meta.tableName;
  def.schema ||= meta.schema;
  def.typeName ||= meta.className.replace(/Entity$/, '');
  def.title ||= def.typeName;
  def.features = Array.from(new Set((def.features || []).concat(Features.getFeatures(o.Entity))));

  _index.get(o.Entity) && console.warn(`Entity already defined: ${def.typeName}`);
  _index.get(def.typeName) && console.warn(`Entity already defined: ${def.typeName}`);
  def.idType && _index.get(def.idType) && console.warn(`Entity already defined: ${def.idType}`);

  _index.set(def.Entity, def);
  _index.set(def.typeName, def);
  def.idType && _index.set(def.idType, def);

  _resource.set(def.Entity, def);

  return def;
}

export function getEntityDef(key: Function | BaseEntity | string | null | undefined) {
  if (!key) {
    return undefined;
  }
  if (key instanceof BaseEntity) {
    key = key.constructor;
  }
  let found = _index.get(key);
  if (!found && typeof key === 'string') {
    let idType = getTypeOfEntityTypeId(key);
    if (idType) {
      found = _index.get(idType);
    }
  }
  return found;
}

export function getEntityDefs() {
  return _resource.values();
}
