import { BaseEntity, Entity, PrimaryKey, Property, types } from '@mikro-orm/core';

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
export abstract class StandardBaseEntity<E extends StandardBaseEntity<any> = any> extends BaseEntity<E, 'id'> {
  @PrimaryKey({ type: types.string, defaultRaw: 'public.gen_ulid()', nullable: false })
  id!: string;

  @Property({ type: types.uuid, columnType: 'uuid', defaultRaw: `gen_random_uuid()`, unique: true, nullable: false })
  uid!: string;

  @Property({ type: types.string, nullable: true })
  eid?: string;

  @Property({ type: types.datetime, defaultRaw: 'current_timestamp' })
  createdAt!: Date;

  @Property({
    type: types.datetime,
    defaultRaw: 'current_timestamp',
    onUpdate: () => new Date(),
  })
  updatedAt!: Date;

  @Property({ type: types.datetime, nullable: true, hidden: true })
  deletedAt?: Date;

  @Property({ type: types.json, nullable: false, default: '{}' })
  attributes!: Record<string, any>;

  @Property({ type: types.json, nullable: false, default: '{}' })
  properties!: Record<string, any>;

  @Property({ type: types.json, nullable: false, default: '{}' })
  extensions!: Record<string, any>;
}
