import { AnyEntity, EntityClass, EntityClassGroup, EntitySchema } from '@mikro-orm/core';

export type EntityType = string | EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema;
