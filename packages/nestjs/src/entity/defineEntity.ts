import { EntityClass, MetadataStorage } from '@mikro-orm/core';
import { getTypeOfEntityTypeId } from './parseEntityTypeId';

interface DefineEntityOptions {
  Entity: EntityClass<any>;
  idType?: string;
  tableName?: string;
  typeName?: string;
  title?: string;
  metadata?: Record<string, any>;
}

interface EntityDef {
  Entity: EntityClass<any>;
  idType?: string;
  typeName: string;
  tableName?: string;
  metadata: Record<string, any>;
}

let _map = new Map<EntityClass<any> | string, EntityDef>();

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
  def.typeName ||= meta.className.replace(/Entity$/, '');

  _map.get(o.Entity) && console.warn(`Entity already defined: ${def.typeName}`);
  _map.get(def.typeName) && console.warn(`Entity already defined: ${def.typeName}`);
  def.idType && _map.get(def.idType) && console.warn(`Entity already defined: ${def.idType}`);

  _map.set(def.Entity, def);
  _map.set(def.typeName, def);
  def.idType && _map.set(def.idType, def);
  // _map.set(def.tableName, def);
  return o;
}

export function getEntityDef(key: EntityClass<any> | string | null | undefined) {
  if (!key) {
    return undefined;
  }
  let found = _map.get(key);
  if (!found && typeof key === 'string') {
    let idType = getTypeOfEntityTypeId(key);
    if (idType) {
      found = _map.get(idType);
    }
  }
  return found;
}

export function getEntityDefs() {
  return _map.values();
}
