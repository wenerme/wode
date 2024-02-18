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

export type StandardBaseEntityOptionalFields =
  | 'id'
  | 'uid'
  | 'createdAt'
  | 'updatedAt'
  | 'sid' // number based serial id
  | 'tid'
  | 'attributes'
  | 'properties'
  | 'extensions';

@Entity({ abstract: true })
export abstract class StandardBaseEntity extends BaseEntity {
  [PrimaryKeyProp]?: 'id';
  [Config]?: DefineConfig<{ forceObject: true }>;

  @PrimaryKey({ type: types.string, defaultRaw: 'public.gen_ulid()', nullable: false })
  id!: string & Opt;

  @Property({ type: types.uuid, columnType: 'uuid', defaultRaw: `gen_random_uuid()`, unique: true, nullable: false })
  uid!: string & Opt;

  @Property({ type: types.string, nullable: true })
  eid?: string;

  @Property({ type: types.datetime, defaultRaw: 'current_timestamp' })
  createdAt!: Date & Opt;

  @Property({
    type: types.datetime,
    defaultRaw: 'current_timestamp',
    onUpdate: () => new Date(),
  })
  updatedAt!: Date & Opt;

  @Property({ type: types.datetime, nullable: true, hidden: true })
  deletedAt?: Date;

  @Property({ type: types.json, nullable: false, default: '{}' })
  attributes!: Record<string, any> & Opt;

  @Property({ type: types.json, nullable: false, default: '{}' })
  properties!: Record<string, any> & Opt;

  @Property({ type: types.json, nullable: false, default: '{}' })
  extensions!: Record<string, any> & Opt;
}
