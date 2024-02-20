import {
  BaseEntity,
  Config,
  DefineConfig,
  Entity,
  Opt,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  types,
} from '@mikro-orm/core';

export type MinimalBaseEntityOptionalFields =
  | 'id'
  | 'uid'
  | 'createdAt'
  | 'updatedAt'
  | 'sid' // number based serial id
  | 'tid'
  | 'attributes'
  | 'properties'
  | 'extensions';

/**
 * Add Minimal prefix to avoid conflict with real entity, MikroORM not allowed different entity with same name
 */
@Entity({ abstract: true })
export abstract class MinimalBaseEntity extends BaseEntity {
  [PrimaryKeyProp]?: 'id';
  [Config]?: DefineConfig<{ forceObject: true }>;

  @PrimaryKey({ type: types.string, defaultRaw: 'public.gen_ulid()', nullable: false })
  id!: string & Opt;

  @Property({ type: types.uuid, columnType: 'uuid', defaultRaw: 'gen_random_uuid()', unique: true, nullable: false })
  uid!: string & Opt;

  @Property({ type: types.datetime, defaultRaw: 'current_timestamp' })
  createdAt!: Date & Opt;

  @Property({
    type: types.datetime,
    defaultRaw: 'current_timestamp',
    onUpdate: () => new Date(),
  })
  updatedAt!: Date & Opt;

  @Property({ type: types.datetime, nullable: true })
  deletedAt?: Date;
}
