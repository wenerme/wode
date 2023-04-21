import { BaseEntity, Entity, PrimaryKey, Property, types, Unique } from '@mikro-orm/core';

@Entity({ abstract: true })
export abstract class MinimalBaseEntity<E extends MinimalBaseEntity<any>> extends BaseEntity<E, 'id'> {
  @PrimaryKey({ type: types.string, defaultRaw: 'public.gen_ulid()' })
  id!: string;

  @Unique({ name: 'app_user_uid_key' })
  @Property({ type: types.uuid, columnType: 'uuid', defaultRaw: `gen_random_uuid()` })
  uid!: string;

  // @Property({type: types.string, columnType: 'text', nullable: true})
  // eid?: string;

  @Property({ type: types.datetime, columnType: 'timestamptz', defaultRaw: 'current_timestamp' })
  createdAt!: Date;

  @Property({
    type: types.datetime,
    columnType: 'timestamptz',
    defaultRaw: 'current_timestamp',
    onUpdate: () => new Date(),
  })
  updatedAt!: Date;

  @Property({ type: types.datetime, length: 6, nullable: true })
  deletedAt?: Date;
}
