import { Entity, MetadataStorage } from '@mikro-orm/core';
import { Errors, getObjectId } from '@wener/utils';

/**
 * Make sure there only one Entity Reference, help to dedup modules.
 */
export function checkMikroOrmEnv(opts: { Entity?: any; MetadataStorage?: any } = {}) {
  opts.Entity &&
    Errors.BadRequest.check(
      opts.Entity === Entity,
      `Entity instance mismatch: ${getObjectId(opts.Entity)} -> ${getObjectId(Entity)}`,
    );

  opts.MetadataStorage &&
    Errors.BadRequest.check(
      opts.MetadataStorage === MetadataStorage,
      `MetadataStorage instance mismatch: ${getObjectId(opts.MetadataStorage)} -> ${getObjectId(MetadataStorage)}`,
    );

  return {
    Entity,
    EntityId: getObjectId(Entity),
    MetadataStorage,
    MetadataStorageId: getObjectId(MetadataStorage),
  };
}
