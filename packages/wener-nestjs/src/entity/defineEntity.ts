import { BaseEntity, MetadataStorage, type EntityClass } from '@mikro-orm/core';
import { Errors } from '@wener/utils';
import { Features } from '../Feature';
import { getTypeOfEntityTypeId } from './parseEntityTypeId';

export interface DefineEntityOptions {
  Entity: EntityClass<any>;
  idType?: string;
  tableName?: string;
  typeName?: string;
  schema?: string;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
  features?: string[];
}

export interface EntityDef {
  Entity: EntityClass<any>;
  idType?: string;
  typeName: string;
  title: string;
  description?: string;
  metadata: Record<string, any>;
  tableName?: string;
  schema?: string;
  features: string[];
}

let _all: EntityDef[] = [];
let _index = new Map<EntityClass<any> | string, EntityDef>();

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

  let last = _index.get(o.Entity) || _index.get(def.typeName) || (def.idType ? _index.get(def.idType) : undefined);
  if (last) {
    console.warn(
      `Entity already defined: idType=${def.idType} typeName=${def.typeName} -> ${last.idType} ${last.typeName}`,
    );
  }

  _index.set(def.Entity, def);
  _index.set(def.typeName, def);
  def.idType && _index.set(def.idType, def);

  _all.push(def);

  return def;
}

export function getEntityDef(key: Function | BaseEntity | string | null | undefined): EntityDef | undefined {
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

export function requireEntityDef(key: Function | BaseEntity | string | null | undefined): EntityDef {
  return Errors.BadRequest.require(getEntityDef(key), 'Entity def not found');
}

export function getEntityDefs() {
  return _all;
  // return Iterator.from(_all);
}
